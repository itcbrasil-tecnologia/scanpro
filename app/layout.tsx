// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthContextProvider } from "@/context/AuthContext"; // Importar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScanPRO",
  description: "Sistema de Conferência de Dispositivos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50 text-slate-800`}>
        <AuthContextProvider>
          {" "}
          {/* Envolver a aplicação */}
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
      </body>
    </html>
  );
}
