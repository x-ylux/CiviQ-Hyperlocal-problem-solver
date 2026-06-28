export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "citizen" | "officer" | "admin";
  credits: number;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: string;
}

export interface ReportLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface ReportTimelineEvent {
  title: string;
  timestamp: string;
  description: string;
  actor?: string;
}

export interface CivicReport {
  id: string;
  reporterId: string;
  reporterName: string;
  category: "roads" | "water" | "waste" | "lights" | "parks" | "build" | "power" | "traffic";
  title: string;
  description: string;
  imageUrl?: string;
  location: ReportLocation;
  status: "open" | "in_progress" | "citizen_verify" | "resolved";
  upvotes: number;
  upvotedBy: string[];
  timeline: ReportTimelineEvent[];
  assignedContractor?: string;
  slaDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarbonEntry {
  id: string;
  userId: string;
  date: string;
  transportationKm: number;
  electricityKwh: number;
  wasteKg: number;
  totalCo2Kg: number;
  tips: string[];
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "critical";
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  severity: "info" | "warning" | "critical";
}
