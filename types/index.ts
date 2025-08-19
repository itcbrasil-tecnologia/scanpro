import { Timestamp } from "firebase/firestore";

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
  id?: string;
  userName?: string;
  projectName: string;
  umName?: string;
  userId?: string;
  // ADICIONADO DE VOLTA: Este campo é essencial para a lógica de salvamento
  conferenceStartTime?: Date;
  startTime: Timestamp;
  endTime: Timestamp;
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
