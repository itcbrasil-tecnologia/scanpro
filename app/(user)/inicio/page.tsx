// app/(user)/inicio/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";

export default function InicioPage() {
  const { userProfile } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Página Inicial do Técnico</h1>
      <p className="mt-2">Bem-vindo, {userProfile?.nome}!</p>
    </div>
  );
}
