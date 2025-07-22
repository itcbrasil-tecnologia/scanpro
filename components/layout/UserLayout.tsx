"use client";

import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { AuthGuard } from "./AuthGuard"; // Importa o novo guardião

export function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["USER"]} redirectPath="/dashboard">
      {(
        userProfile // Recebe o userProfile do AuthGuard
      ) => (
        <div className="min-h-screen bg-slate-100">
          <Navbar userProfile={userProfile} />
          <main className="p-4">{children}</main>
        </div>
      )}
    </AuthGuard>
  );
}
