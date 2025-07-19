"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";

export function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se o carregamento terminou e não há usuário, redireciona para o login.
    if (!loading && !user) {
      router.replace("/");
    }
    // Se o perfil foi carregado e é de um admin/master, redireciona para o dashboard.
    else if (
      userProfile &&
      (userProfile.role === "MASTER" || userProfile.role === "ADMIN")
    ) {
      router.replace("/dashboard");
    }
  }, [user, userProfile, loading, router]);

  // Exibe "Carregando..." enquanto a autenticação está pendente
  // OU se já temos um usuário mas ainda não carregamos seu perfil do Firestore.
  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div>Carregando...</div>
      </div>
    );
  }

  // Se o perfil estiver carregado e for do tipo correto, exibe o conteúdo.
  if (userProfile.role === "USER") {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar userProfile={userProfile} />
        <main className="p-4">{children}</main>
      </div>
    );
  }

  // Caso contrário, não renderiza nada enquanto o redirecionamento acontece.
  return null;
}
