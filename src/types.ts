export type UserRole = 'patient' | 'doctor';

export interface UserProfile {
  uid: string;
  username: string;
  role: UserRole;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  createdAt: number;
  avatarUrl?: string;
  points?: number;
  surgeryDate?: number;
  nextCheckupDate?: number;
}

export interface RecoveryLog {
  id: string;
  patientId: string;
  timestamp: number;
  phase: 'early' | 'recovery';
  symptoms: string[];
  diet: string;
  activity: string;
  isCompliant: boolean;
  pointsEarned: number;
}

export interface DetectionRecord {
  id: string;
  patientId: string;
  imageUrl: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  resultType: string; // e.g., "未发现息肉", "发现腺瘤性息肉"
  timestamp: number;
  aiReport?: string;
  inferenceTime?: number;
  detectedPoints?: any[];
  pathologicalParams?: {
    size?: string;
    morphology?: string;
    vascularity?: string;
  };
}

export interface Article {
  id: string;
  title: string;
  category: 'diet' | 'prevention' | 'exercise' | 'guidance';
  content: string;
  author: string;
  createdAt: number;
  imageUrl?: string;
  externalLink?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ConsultationMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'system';
}

export interface ConsultationRoom {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: Record<string, number>;
}
