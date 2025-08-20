"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import toast from "react-hot-toast";
import { KeyRound, ArrowLeft } from "lucide-react";
import { Field, Label, Input } from "@headlessui/react";
import { AppButton } from "@/components/ui/AppButton"; // ADICIONADO

export default function AlterarSenhaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos.", {
        id: "global-toast",
      });
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem.", { id: "global-toast" });
      setIsLoading(false);
      return;
    }

    if (!user) {
      toast.error("Usuário não autenticado. Por favor, faça login novamente.", {
        id: "global-toast",
      });
      router.push("/");
      setIsLoading(false);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success("Senha alterada com sucesso!", { id: "global-toast" });
      router.back();
    } catch (error: unknown) {
      console.error("Erro ao alterar a senha:", error);
      if (typeof error === "object" && error !== null && "code" in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === "auth/wrong-password") {
          toast.error("A senha atual está incorreta.", { id: "global-toast" });
        } else if (firebaseError.code === "auth/weak-password") {
          toast.error(
            "A nova senha é muito fraca. Use pelo menos 6 caracteres.",
            { id: "global-toast" }
          );
        } else {
          toast.error("Ocorreu um erro ao alterar a senha.", {
            id: "global-toast",
          });
        }
      } else {
        toast.error("Ocorreu um erro inesperado ao alterar a senha.", {
          id: "global-toast",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
            <KeyRound className="h-6 w-6 text-teal-600" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Alterar Senha
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Para sua segurança, digite sua senha atual antes de definir uma
            nova.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handlePasswordChange}>
          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Senha Atual
            </Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 data-[hover]:border-teal-400"
            />
          </Field>

          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Nova Senha
            </Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 data-[hover]:border-teal-400"
            />
          </Field>

          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Confirmar Nova Senha
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 data-[hover]:border-teal-400"
            />
          </Field>

          <div>
            <AppButton
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="w-full"
            >
              {isLoading ? "Salvando..." : "Salvar Nova Senha"}
            </AppButton>
          </div>
        </form>

        <div className="text-center">
          <AppButton
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="!text-teal-600 hover:!text-teal-500"
          >
            <ArrowLeft size={16} className="mr-1" />
            Voltar
          </AppButton>
        </div>
      </div>
    </div>
  );
}
