"use client";

import React from "react";
import Navbar from "@/components/ui/Navbar";
import { AuthGuard } from "./AuthGuard";

export function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["USER"]} redirectPath="/dashboard">
      {(userProfile) => (
        <div className="min-h-screen bg-slate-100 dark:bg-zinc-900">
          <Navbar userProfile={userProfile} />
          <main className="p-4">{children}</main>
        </div>
      )}
    </AuthGuard>
  );
}
