// components/layout/UserLayout.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
// A importação de 'UserProfile' foi removida.

export function UserLayout({ children }: { children: React.ReactNode }) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Carregando...</div>
      </div>
    );
  }

  if (!userProfile) {
    router.replace("/");
    return null;
  }

  if (userProfile.role === "MASTER" || userProfile.role === "ADMIN") {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar userProfile={userProfile} />
      <main className="p-4">{children}</main>
    </div>
  );
}
