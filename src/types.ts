export interface AIAnalysis {
  isValid: boolean;
  confidence: number; // 0 to 100
  rationale: string;
  detectedObjects: string[];
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  environmentalImpact: string;
  suggestedCategory: string;
}

export interface StatusUpdate {
  status: 'Pending' | 'Verifying' | 'In Progress' | 'Resolved';
  note: string;
  updatedAt: string;
  author: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  mediaUrl?: string; // base64 or placeholder URL
  mediaType: 'image' | 'video' | 'none';
  reporterName: string;
  reporterEmail: string;
  status: 'Pending' | 'Verifying' | 'In Progress' | 'Resolved';
  upvotes: number;
  upvoters: string[]; // emails of users who upvoted
  createdAt: string;
  credibilityScore: number; // calculated combining AI confidence and upvotes
  aiAnalysis?: AIAnalysis;
  governmentNotes?: string;
  updates: StatusUpdate[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon string
  color: string; // tailwind color classes
}

export interface UserProfile {
  email: string;
  name: string;
  points: number;
  reportedCount: number;
  verifiedCount: number;
  badges: string[]; // badge IDs
  isGovernment?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface SystemInsight {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  recommendation: string;
  categoryAffected: string;
}

export interface DashboardMetrics {
  totalIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
  pendingIssues: number;
  averageCredibility: number;
  categoryDistribution: { [category: string]: number };
  weeklyTrend: { day: string; count: number }[];
}
