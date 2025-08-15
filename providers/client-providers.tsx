"use client";

import { Toaster } from "react-hot-toast";
import { AuthContextProvider, useAuth } from "@/context/AuthContext";
import React from "react";

// Novo componente interno para gerenciar o estado de carregamento
function AuthHandler({ children }: { children: React.ReactNode }) {
  const { loading, authError } = useAuth();

  if (authError) {
    // Se o AuthContext nos informar de um erro, exibimos a mensagem.
    // Esta é a falha graciosa que implementamos anteriormente.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-red-600 text-center p-4">
        <h2 className="text-xl font-bold mb-2">Erro de Conexão</h2>
        <p>{authError}</p>
      </div>
    );
  }

  if (loading) {
    // Exibe uma tela de carregamento global enquanto o status de autenticação é verificado
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-slate-500">Carregando Aplicação...</div>
      </div>
    );
  }

  // Apenas quando o carregamento terminar (e não houver erros), renderiza o conteúdo da aplicação
  return <>{children}</>;
}

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
            style: { background: "#10B981", color: "white" },
            iconTheme: { primary: "white", secondary: "#10B981" },
          },
          error: {
            style: { background: "#EF4444", color: "white" },
            iconTheme: { primary: "white", secondary: "#EF4444" },
          },
        }}
      />
      {/* O AuthHandler agora envolve o conteúdo principal */}
      <AuthHandler>{children}</AuthHandler>
    </AuthContextProvider>
  );
}
