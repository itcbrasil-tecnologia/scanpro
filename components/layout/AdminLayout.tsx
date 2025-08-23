"use client";

import React from "react";
import Navbar from "@/components/ui/Navbar";
import { AuthGuard } from "./AuthGuard";
import { PageTransition } from "@/providers/page-transition";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["MASTER", "ADMIN"]} redirectPath="/inicio">
      {(userProfile) => (
        <div className="min-h-screen bg-slate-100 dark:bg-zinc-900">
          <Navbar userProfile={userProfile} />
          <main className="p-4 sm:p-6 lg:p-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      )}
    </AuthGuard>
  );
}
