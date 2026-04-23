import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // Baidu AI Credentials
  const BAIDU_API_KEY = process.env.BAIDU_API_KEY || "nKWWgBvDs3xyKZNpGoIAkWXn";
  const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || "pRpe2U0Hka0EdQR5SnxOhPGczIML35FE";

  let baiduAccessToken = "";
  let tokenExpiresAt = 0;

  async function getBaiduToken() {
    if (baiduAccessToken && Date.now() < tokenExpiresAt) {
      return baiduAccessToken;
    }

    try {
      const response = await axios.get("https://aip.baidubce.com/oauth/2.0/token", {
        params: {
          grant_type: "client_credentials",
          client_id: BAIDU_API_KEY,
          client_secret: BAIDU_SECRET_KEY,
        },
      });
      baiduAccessToken = response.data.access_token;
      tokenExpiresAt = Date.now() + response.data.expires_in * 1000 - 60000; // Expires 1 min early
      return baiduAccessToken;
    } catch (error) {
      console.error("Failed to fetch Baidu token:", error);
      throw error;
    }
  }

  // --- Consultation System (Self-Hosted for Competition & Domestic Access) ---
  const DATA_FILE = path.join(process.cwd(), 'data_store.json');

  // Load data from file if exists
  let persistedData = { localUsers: [], chatRooms: [], chatMessages: {}, clinicalRecords: {} };
  if (fs.existsSync(DATA_FILE)) {
    try {
      persistedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
      console.error("Failed to load data store:", e);
    }
  }

  const localUsers: any[] = persistedData.localUsers || [];
  const chatRooms: any[] = persistedData.chatRooms || [];
  const chatMessages: Record<string, any[]> = persistedData.chatMessages || {};
  const clinicalRecords: Record<string, any[]> = persistedData.clinicalRecords || {};

  const saveData = () => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ localUsers, chatRooms, chatMessages, clinicalRecords }, null, 2));
    } catch (e) {
      console.error("Failed to save data store:", e);
    }
  };

  // API: Sync user to local store
  app.post("/api/sync-user", (req, res) => {
    const user = req.body;
    if (!user || !user.uid) return res.status(400).json({ error: "Invalid user data" });
    
    const index = localUsers.findIndex(u => u.uid === user.uid);
    if (index === -1) {
      localUsers.push(user);
    } else {
      localUsers[index] = { ...localUsers[index], ...user };
    }
    saveData();
    res.json({ success: true });
  });

  // API: Get all available doctors
  app.get("/api/consultation/doctors", (req, res) => {
    const doctors = localUsers.filter(u => u.role === 'doctor');
    res.json(doctors);
  });

  // API: Get all patients (for Doctor Management)
  app.get("/api/consultation/patients", (req, res) => {
    const patients = localUsers.filter(u => u.role === 'patient');
    res.json(patients);
  });

  // API: Sync clinical record (called when patient finishes a report)
  app.post("/api/clinical-records", (req, res) => {
    const { userId, record } = req.body;
    if (!userId || !record) return res.status(400).json({ error: "Incomplete data" });
    
    if (!clinicalRecords[userId]) clinicalRecords[userId] = [];
    
    // Check if record already exists to avoid duplicates
    const exists = clinicalRecords[userId].some(r => r.id === record.id);
    if (!exists) {
      clinicalRecords[userId].push(record);
      saveData();
    }
    res.json({ success: true });
  });

  // API: Get clinical records for a specific patient
  app.get("/api/clinical-records/:userId", (req, res) => {
    const { userId } = req.params;
    res.json(clinicalRecords[userId] || []);
  });

  // API: Get rooms for a user
  app.get("/api/consultation/rooms", (req, res) => {
    const { userId, role } = req.query;
    const filteredRooms = chatRooms.filter(room => 
      role === 'patient' ? room.patientId === userId : room.doctorId === userId
    ).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    res.json(filteredRooms);
  });

  // API: Create or join a room
  app.post("/api/consultation/rooms", (req, res) => {
    const { patientId, doctorId, patientName, doctorName } = req.body;
    const roomId = `room_${patientId}_${doctorId}`;
    
    let room = chatRooms.find(r => r.id === roomId);
    if (!room) {
      room = {
        id: roomId,
        patientId,
        doctorId,
        patientName,
        doctorName,
        lastMessage: "对话开启",
        lastMessageTime: Date.now()
      };
      chatRooms.push(room);
      chatMessages[roomId] = [];
    }
    saveData();
    res.json(room);
  });

  // API: Get messages for a room
  app.get("/api/consultation/rooms/:roomId/messages", (req, res) => {
    const { roomId } = req.params;
    res.json(chatMessages[roomId] || []);
  });

  // API: Send a message
  app.post("/api/consultation/rooms/:roomId/messages", (req, res) => {
    const { roomId } = req.params;
    const { senderId, senderName, content, type } = req.body;
    
    if (!chatMessages[roomId]) chatMessages[roomId] = [];
    
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderId,
      senderName,
      content,
      type: type || 'text',
      timestamp: Date.now()
    };
    
    chatMessages[roomId].push(newMessage);
    
    // Update room last message
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
      room.lastMessage = type === 'image' ? '[图片消息]' : content;
      room.lastMessageTime = newMessage.timestamp;
    }
    
    saveData();
    res.json(newMessage);
  });
  // --- End Consultation System ---

  // API Route for Food Analysis
  app.post("/api/analyze-food", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      const accessToken = await getBaiduToken();
      
      // Call Baidu Dish Recognition API
      const response = await axios.post(
        "https://aip.baidubce.com/rest/2.0/image-classify/v2/dish",
        `image=${encodeURIComponent(image)}`,
        {
          params: { access_token: accessToken },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error("Baidu API error:", error.message);
      res.status(500).json({ error: "Failed to analyze food" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
