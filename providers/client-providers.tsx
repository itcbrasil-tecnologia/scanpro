"use client";

import { Toaster } from "react-hot-toast";
import { AuthContextProvider } from "@/context/AuthContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthContextProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            borderRadius: "8px",
            padding: "16px",
          },
          success: {
            style: {
              background: "#10B981",
              color: "white",
            },
            iconTheme: {
              primary: "white",
              secondary: "#10B981",
            },
          },
          error: {
            style: {
              background: "#EF4444",
              color: "white",
            },
            iconTheme: {
              primary: "white",
              secondary: "#EF4444",
            },
          },
        }}
      />
      {children}
    </AuthContextProvider>
  );
}
