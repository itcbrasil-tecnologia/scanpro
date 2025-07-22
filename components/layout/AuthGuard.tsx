"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";

interface AuthGuardProps {
  children: (userProfile: UserProfile) => React.ReactNode;
  allowedRoles: Array<"MASTER" | "ADMIN" | "USER">;
  redirectPath: string;
}

export function AuthGuard({
  children,
  allowedRoles,
  redirectPath,
}: AuthGuardProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se o carregamento terminou e não há usuário ou perfil, redireciona para o login.
    if (!loading && !user) {
      router.replace("/");
      return;
    }

    // Se o perfil foi carregado, mas a role não está na lista de permitidas, redireciona.
    if (!loading && userProfile && !allowedRoles.includes(userProfile.role)) {
      router.replace(redirectPath);
    }
  }, [user, userProfile, loading, router, allowedRoles, redirectPath]);

  // Exibe um estado de carregamento centralizado enquanto a verificação está em andamento
  // ou se o perfil ainda não corresponde à role permitida (aguardando redirecionamento).
  if (loading || !userProfile || !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  // Se tudo estiver correto, renderiza o conteúdo da página, passando o userProfile.
  return <>{children(userProfile)}</>;
}
