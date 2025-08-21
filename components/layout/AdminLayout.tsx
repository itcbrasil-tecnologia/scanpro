"use client";

import React from "react";
import Navbar from "@/components/ui/Navbar";
import { AuthGuard } from "./AuthGuard";
import { PageTransition } from "@/providers/page-transition";

// A lógica da CommandPalette (useState, useEffect, etc.) foi completamente removida.

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["MASTER", "ADMIN"]} redirectPath="/inicio">
      {(userProfile) => (
        <div className="min-h-screen bg-slate-100">
          {/* A prop 'onOpenCommandPalette' foi removida da Navbar */}
          <Navbar userProfile={userProfile} />
          <main className="p-4 sm:p-6 lg:p-8">
            <PageTransition>{children}</PageTransition>
          </main>
          {/* O componente CommandPalette foi removido */}
        </div>
      )}
    </AuthGuard>
  );
}
