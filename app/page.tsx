"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/inicio");
    }
  }, [user, authLoading, router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha e-mail e senha.", {
        id: "global-toast",
      });
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login realizado com sucesso! Redirecionando...", {
        id: "global-toast",
      });
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/invalid-credential"
      ) {
        toast.error("E-mail ou senha inválidos. Tente novamente.", {
          id: "global-toast",
        });
      } else {
        console.error("Erro no login (desconhecido):", error);
        toast.error("Ocorreu um erro inesperado.", { id: "global-toast" });
      }
      setIsLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <Image
            src="/Logo.svg"
            alt="ScanPRO Logo"
            width={180}
            height={60}
            className="mx-auto mb-4"
            priority
          />
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para continuar
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Redirecionando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
