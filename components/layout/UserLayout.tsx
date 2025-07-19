// components/layout/UserLayout.tsx
"use client";

import React, { useEffect } from "react"; // Importar useEffect
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";

export function UserLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  // Lógica de redirecionamento movida para dentro do useEffect
  useEffect(() => {
    if (!loading && !userProfile) {
      router.replace("/");
    } else if (
      userProfile &&
      (userProfile.role === "MASTER" || userProfile.role === "ADMIN")
    ) {
      router.replace("/dashboard");
    }
  }, [userProfile, loading, router]);

  if (loading || !userProfile || userProfile.role !== "USER") {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar userProfile={userProfile} />
      <main className="p-4">{children}</main>
    </div>
  );
}
