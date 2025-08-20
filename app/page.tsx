"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword, UserCredential } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { Field, Label, Input } from "@headlessui/react";
import { AppButton } from "@/components/ui/AppButton"; // ADICIONADO

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar sessão no servidor.");
      }

      router.push("/inicio");
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/invalid-credential"
      ) {
        toast.error("E-mail ou senha inválidos. Tente novamente.", {
          id: "global-toast",
        });
      } else {
        console.error("Erro no login:", error);
        toast.error("Ocorreu um erro inesperado durante o login.", {
          id: "global-toast",
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <Image
            src="/Logo.svg"
            alt="ScanPRO Logo"
            width={180}
            height={60}
            className="mx-auto mb-4 h-auto"
            priority
          />
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para continuar
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              E-mail
            </Label>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 data-[hover]:border-teal-400"
            />
          </Field>

          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Senha
            </Label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 data-[hover]:border-teal-400"
              />
              <AppButton
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 !text-gray-400 data-[hover]:!text-gray-600"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </AppButton>
            </div>
          </Field>

          <div>
            <AppButton
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="w-full"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </AppButton>
          </div>
        </form>
      </div>
    </main>
  );
}
