// app/(admin)/dashboard/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Proteção extra no cliente: Se um USER chegar aqui, redireciona
  if (userProfile && userProfile.role === "USER") {
    router.replace("/inicio");
    return null;
  }

  return (
    <div>
      <h1>Dashboard (ADMIN/MASTER)</h1>
      <p>Bem-vindo, {userProfile?.nome}</p>
      <p>Seu perfil é: {userProfile?.role}</p>
    </div>
  );
}
