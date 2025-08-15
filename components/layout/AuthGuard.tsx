"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { useEffect } from "react";

interface AuthGuardProps {
  children: (userProfile: UserProfile) => React.ReactNode;
  allowedRoles: string[];
  redirectPath: string;
}

export const AuthGuard = ({
  children,
  allowedRoles,
  redirectPath,
}: AuthGuardProps) => {
  const { userProfile, authError } = useAuth(); // Não precisamos mais do 'loading' aqui
  const router = useRouter();

  useEffect(() => {
    // A lógica agora é mais simples: se o perfil existe, mas a role é errada, redireciona.
    if (userProfile && !allowedRoles.includes(userProfile.role)) {
      router.replace(redirectPath);
    }
  }, [userProfile, router, allowedRoles, redirectPath]);

  // Se o perfil não corresponder, renderiza null brevemente enquanto o useEffect redireciona.
  // A tela de "Carregando..." global já foi exibida pelo AuthHandler.
  if (!userProfile || !allowedRoles.includes(userProfile.role) || authError) {
    return null;
  }

  return <>{children(userProfile)}</>;
};
