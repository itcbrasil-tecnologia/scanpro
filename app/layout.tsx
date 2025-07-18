// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
        {/* O Toaster renderizará as notificações Toast em toda a aplicação */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            // Estilos padrão para os toasts
            style: {
              borderRadius: "8px",
              padding: "16px",
            },
            // Estilos para toasts de sucesso (Verde)
            success: {
              style: {
                background: "#10B981", // green-500
                color: "white",
              },
              iconTheme: {
                primary: "white",
                secondary: "#10B981",
              },
            },
            // Estilos para toasts de erro (Vermelho)
            error: {
              style: {
                background: "#EF4444", // red-500
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
      </body>
    </html>
  );
}
