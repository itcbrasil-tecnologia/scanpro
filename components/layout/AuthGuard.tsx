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
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (userProfile && !allowedRoles.includes(userProfile.role)) {
        router.replace(redirectPath);
      }
    }
  }, [userProfile, loading, router, allowedRoles, redirectPath]);

  // Enquanto o AuthContext carrega o perfil, ou se o perfil não for válido, não exibe nada.
  // A tela de carregamento global já foi exibida pelo ClientProviders.
  if (loading || !userProfile || !allowedRoles.includes(userProfile.role)) {
    return null;
  }

  return <>{children(userProfile)}</>;
};
