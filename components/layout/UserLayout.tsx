"use client";

import React from "react";
// ALTERADO DE "import { Navbar }" PARA "import Navbar"
import Navbar from "@/components/ui/Navbar";
import { AuthGuard } from "./AuthGuard";

export function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["USER"]} redirectPath="/dashboard">
      {(userProfile) => (
        <div className="min-h-screen bg-slate-100">
          <Navbar userProfile={userProfile} />
          <main className="p-4">{children}</main>
        </div>
      )}
    </AuthGuard>
  );
}
