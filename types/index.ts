export type UserRole = "USER" | "ADMIN" | "MASTER";

export interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  whatsapp: string;
  role: UserRole;
  dailyConferenceGoal?: number; // NOVA PROPRIEDADE
}
