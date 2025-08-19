export type UserRole = "USER" | "ADMIN" | "MASTER";

export interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  whatsapp: string;
  role: UserRole;
  dailyConferenceGoal?: number;
  pushSubscription?: object;
}

export interface ConferenceData {
  id?: string; // PROPRIEDADE ADICIONADA AQUI
  userName?: string;
  projectName: string;
  umName?: string;
  userId?: string;
  conferenceStartTime?: Date;
  date: string;
  startTime?: string;
  endTime: string;
  expectedCount: number;
  scannedCount: number;
  missingCount: number;
  scannedDevices: string[];
  missingDevices: string[];
  maintenanceDevices?: string[];
  maintenanceCount?: number;
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
  latitude?: number;
  longitude?: number;
}
