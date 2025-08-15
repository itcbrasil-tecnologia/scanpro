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
      if (!userProfile) {
        router.replace("/");
      } else if (!allowedRoles.includes(userProfile.role)) {
        router.replace(redirectPath);
      }
    }
  }, [userProfile, loading, router, allowedRoles, redirectPath]);

  if (loading || !userProfile || !allowedRoles.includes(userProfile.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  return <>{children(userProfile)}</>;
};
