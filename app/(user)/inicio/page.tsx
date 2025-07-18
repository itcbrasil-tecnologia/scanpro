// app/(user)/inicio/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function InicioPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div>Carregando...</div>;
  }

  // Redireciona o Admin/Master para o dashboard correto
  if (
    userProfile &&
    (userProfile.role === "ADMIN" || userProfile.role === "MASTER")
  ) {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div>
      <h1>Página Inicial do Técnico (USER)</h1>
      <p>Bem-vindo, {userProfile?.nome}</p>
    </div>
  );
}
