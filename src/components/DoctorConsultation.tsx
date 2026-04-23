import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  User, 
  MessageSquare, 
  Search, 
  ChevronRight, 
  Loader2, 
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  AlertTriangle,
  Image as ImageIcon,
  Paperclip,
  X,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { UserProfile, ConsultationMessage, ConsultationRoom } from '../types';

interface DoctorConsultationProps {
  user: UserProfile;
}

const DoctorConsultation: React.FC<DoctorConsultationProps> = ({ user }) => {
  const [rooms, setRooms] = useState<ConsultationRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ConsultationRoom | null>(null);
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<UserProfile[]>([]);
  const [availablePatients, setAvailablePatients] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'directory'>(user.role === 'patient' ? 'directory' : 'chats');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch directory (Doctors for patients, Patients for doctors)
  const fetchDirectory = async () => {
    try {
      const endpoint = user.role === 'patient' ? '/api/consultation/doctors' : '/api/consultation/patients';
      const response = await axios.get(endpoint);
      if (user.role === 'patient') {
        setAvailableDoctors(response.data);
      } else {
        setAvailablePatients(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch directory:", error);
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/consultation/rooms', {
        params: { userId: user.uid, role: user.role }
      });
      setRooms(response.data);
      if (isLoading) setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setIsLoading(false);
    }
  };

  // Fetch messages for selected room
  const fetchMessages = async (roomId: string) => {
    try {
      const response = await axios.get(`/api/consultation/rooms/${roomId}/messages`);
      const newMessages = response.data;
      
      // Only update if message count changed or initial load
      if (newMessages.length !== messages.length) {
        setMessages(newMessages);
        setTimeout(scrollToBottom, 50);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDirectory();
    fetchRooms();
    
    // Polling for rooms list discovery
    const roomInterval = setInterval(fetchRooms, 5000);
    return () => clearInterval(roomInterval);
  }, [user]);

  // Polling for messages when a room is selected
  useEffect(() => {
    if (!selectedRoom) return;
    
    fetchMessages(selectedRoom.id);
    const msgInterval = setInterval(() => fetchMessages(selectedRoom.id), 3000);
    return () => clearInterval(msgInterval);
  }, [selectedRoom, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("图片大小不能超过 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !imagePreview) || !selectedRoom || isSending) return;

    setIsSending(true);
    const payload = {
      senderId: user.uid,
      senderName: user.name,
      content: imagePreview || input.trim(),
      type: imagePreview ? 'image' : 'text'
    };

    try {
      const response = await axios.post(`/api/consultation/rooms/${selectedRoom.id}/messages`, payload);
      setMessages(prev => [...prev, response.data]);
      setInput('');
      setImagePreview(null);
      setTimeout(scrollToBottom, 50);
      
      // Update local rooms list immediately to show latest message preview
      fetchRooms();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const startConsultation = async (target: UserProfile) => {
    try {
      const response = await axios.post('/api/consultation/rooms', {
        patientId: user.role === 'patient' ? user.uid : target.uid,
        doctorId: user.role === 'patient' ? target.uid : user.uid,
        patientName: user.role === 'patient' ? user.name : target.name,
        doctorName: user.role === 'patient' ? target.name : user.name,
      });
      setSelectedRoom(response.data);
      setActiveTab('chats');
      fetchMessages(response.data.id);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-text-muted">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>正在同步本地实时咨询频道...</p>
      </div>
    );
  }

  // Sidebar - List View
  const renderSidebarList = () => {
    if (activeTab === 'directory') {
      const items = user.role === 'patient' ? availableDoctors : availablePatients;
      const labelSuffix = user.role === 'patient' ? '医师' : '患者';
      const statusLabel = user.role === 'patient' ? '在线诊室' : '就诊中';

      return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="py-20 text-center text-text-muted italic text-xs">
              {user.role === 'patient' ? '当前暂无在线专家，请耐心等待或联系系统。' : '当前暂无注册患者。'}
            </div>
          ) : (
            items.map(item => (
              <button
                key={item.uid}
                onClick={() => startConsultation(item)}
                className="w-full p-4 flex items-center justify-between bg-white rounded-2xl border border-border-base hover:border-brand-blue hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center font-black text-brand-blue text-lg">
                    {item.name[0]}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-text-primary group-hover:text-brand-blue transition-colors">
                      {item.name} {labelSuffix}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-green-600 font-black uppercase tracking-wider">{statusLabel}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:translate-x-1 transition-transform" />
              </button>
            ))
          )}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mt-4">
             <p className="text-[10px] font-bold text-brand-blue flex items-center gap-2 uppercase tracking-widest mb-1">
               <ShieldCheck className="w-3 h-3" />
               系统连接状态
             </p>
             <p className="text-[10px] text-slate-500 leading-relaxed italic">
               您可以直接发起会话，消息将通过临床私有云即时同步。
             </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-text-muted opacity-20" />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              暂无活跃的咨询记录。<br />
              切换至“专家名录”寻找您的主治医生。
            </p>
          </div>
        ) : (
          rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`w-full p-5 flex items-center gap-4 transition-all border-b border-slate-50 hover:bg-slate-50 ${
                selectedRoom?.id === room.id ? 'bg-brand-light/40 border-r-4 border-r-brand-blue' : ''
              }`}
            >
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-500 border border-border-base flex-shrink-0">
                {user.role === 'patient' ? room.doctorName[0] : room.patientName[0]}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-text-primary truncate">
                    {user.role === 'patient' ? room.doctorName : room.patientName}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {room.lastMessageTime ? new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-text-muted truncate leading-relaxed">
                  {room.lastMessage || '暂无消息'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex bg-white rounded-[32px] border border-border-base overflow-hidden shadow-xl h-[calc(100vh-140px)]">
      {/* Sidebar - Room List & Directory */}
      <div className={`w-full md:w-80 border-r border-border-base flex flex-col ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border-base bg-slate-50/50">
          <div className="flex bg-white p-1 rounded-2xl border border-border-base/50 shadow-inner">
            <button 
              onClick={() => setActiveTab('directory')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'directory' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-text-muted hover:bg-slate-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              {user.role === 'patient' ? '专家名录' : '患者名录'}
            </button>
            <button 
              onClick={() => setActiveTab('chats')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'chats' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-text-muted hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {user.role === 'patient' ? '咨询历史' : '咨询箱'}
            </button>
          </div>
        </div>

        {renderSidebarList()}
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-slate-50/30 ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-border-base bg-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="md:hidden p-2 hover:bg-slate-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center font-bold text-brand-blue">
                  {user.role === 'patient' ? selectedRoom.doctorName[0] : selectedRoom.patientName[0]}
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">
                    {user.role === 'patient' ? selectedRoom.doctorName : selectedRoom.patientName}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">在线咨询中</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-text-muted">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-text-muted">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-text-muted">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="text-center py-10">
                <span className="px-3 py-1 bg-slate-100 text-[10px] text-text-muted rounded-full uppercase font-bold tracking-widest">
                  开启于 {new Date(selectedRoom.lastMessageTime || Date.now()).toLocaleDateString()}
                </span>
              </div>
              
              {messages.map((msg, idx) => {
                const isMine = msg.senderId === user.uid;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && (
                        <span className="text-[10px] text-text-muted font-bold mb-1 ml-1">{msg.senderName}</span>
                      )}
                      <div className={`p-4 text-sm leading-relaxed ${
                        isMine 
                          ? 'bg-brand-blue text-white rounded-[24px] rounded-tr-none shadow-md shadow-brand-blue/10' 
                          : 'bg-white text-text-primary rounded-[24px] rounded-tl-none border border-border-base shadow-sm'
                      }`}>
                        {msg.type === 'image' ? (
                          <img 
                            src={msg.content} 
                            alt="Sent image" 
                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.content, '_blank')}
                          />
                        ) : (
                          msg.content
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-[9px] text-text-muted font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && <CheckCheck className="w-3 h-3 text-brand-blue" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-border-base space-y-4">
              <AnimatePresence>
                {imagePreview && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="relative inline-block"
                  >
                    <img src={imagePreview} className="w-20 h-20 object-cover rounded-2xl border-2 border-brand-blue/20" alt="Preview" />
                    <button 
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="relative flex items-center gap-3">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-slate-50 text-text-muted rounded-2xl hover:bg-slate-100 transition-all active:scale-95 border border-border-base"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <div className="relative flex-1 items-center flex">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={imagePreview ? "已选择图片，点发送键上传..." : "请输入您想咨询的内容..."}
                    className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-border-base rounded-[20px] focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue transition-all text-sm"
                    disabled={isSending}
                  />
                  <button 
                    type="submit"
                    disabled={(!input.trim() && !imagePreview) || isSending}
                    className="absolute right-2 p-3 bg-brand-blue text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-brand-blue/20"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center border-2 border-dashed border-border-base mb-6 animate-pulse">
              <MessageSquare className="w-10 h-10 text-text-muted opacity-30" />
            </div>
            <h3 className="text-xl font-black text-text-primary mb-2 uppercase tracking-wide">医生即时咨询</h3>
            <p className="text-sm text-text-muted max-w-sm leading-relaxed">
              选择左侧的会话窗口开启实时交流。我们所有的通信均经过临床级别的加密保护。
            </p>
          </div>
        )}
      </div>


    </div>
  );
};

export default DoctorConsultation;
