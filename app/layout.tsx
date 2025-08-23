import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/providers/client-providers";
import { ThemeProvider } from "@/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScanPRO",
  description: "Sistema de Conferência de Dispositivos",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} bg-slate-100 text-slate-800 dark:bg-zinc-900 dark:text-zinc-200 transition-colors duration-300`}
      >
        <ClientProviders>
          <ThemeProvider>{children}</ThemeProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
