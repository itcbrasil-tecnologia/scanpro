// types/index.ts

// Define os possíveis perfis de usuário, conforme o escopo
export type UserRole = "USER" | "ADMIN" | "MASTER";

// Define a estrutura de dados para o perfil de um usuário no Firestore
export interface UserProfile {
  uid: string;
  email: string;
  nome: string; // Conforme campo "Nome"
  whatsapp: string; // Conforme campo "Whatsapp"
  role: UserRole; // Conforme campo "Perfil"
}
