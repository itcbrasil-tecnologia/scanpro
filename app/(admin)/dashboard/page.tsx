// app/(admin)/dashboard/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { userProfile } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">Bem-vindo, {userProfile?.nome}!</p>
      <p>Seu perfil é: {userProfile?.role}</p>
    </div>
  );
}
