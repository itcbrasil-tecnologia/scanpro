"use client";

import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { AuthGuard } from "./AuthGuard"; // Importa o novo guardião

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["MASTER", "ADMIN"]} redirectPath="/inicio">
      {(
        userProfile // Recebe o userProfile do AuthGuard
      ) => (
        <div className="min-h-screen bg-slate-100">
          <Navbar userProfile={userProfile} />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      )}
    </AuthGuard>
  );
}
