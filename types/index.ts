import { Timestamp } from "firebase/firestore"; // ADICIONADO: Importação do tipo Timestamp

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
  // CORREÇÃO: Tipos ajustados para refletir o schema do Firestore
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

  // REMOVIDO: O campo 'date' era derivado e não pertence ao modelo de dados principal.
  // REMOVIDO: As versões string de startTime e endTime também eram derivadas.
}
