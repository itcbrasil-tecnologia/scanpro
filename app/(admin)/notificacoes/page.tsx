"use client";

import React, { useState, useEffect, Fragment } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { UserProfile } from "@/types";
import toast from "react-hot-toast";
import { Send, Users, User, Check, ChevronsUpDown } from "lucide-react";
import {
  Field,
  Label,
  Input,
  Listbox,
  Transition,
  Textarea,
} from "@headlessui/react";
import { AppButton } from "@/components/ui/AppButton";

export default function NotificacoesPage() {
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const [target, setTarget] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const techQuery = query(
          collection(db, "users"),
          where("role", "==", "USER"),
          orderBy("nome")
        );
        const querySnapshot = await getDocs(techQuery);
        const techList = querySnapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as UserProfile)
        );
        setTechnicians(techList);
      } catch (error) {
        console.error("Erro ao buscar técnicos:", error);
        toast.error("Não foi possível carregar a lista de técnicos.");
      }
    };
    fetchTechnicians();
  }, []);

  // CORREÇÃO 1: A função não precisa mais receber o evento do formulário (e)
  const handleSendNotification = async () => {
    if (!title || !message) {
      toast.error("Titulo e mensagem são obrigatórios.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: target,
          payload: {
            title: title,
            body: message,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Falha ao enviar notificação.");
      }
      toast.success(result.message);
      setTitle("");
      setMessage("");
      setTarget("all");
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Ocorreu um erro desconhecido.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTargetName = (targetId: string) => {
    if (targetId === "all") return "Todos os Técnicos";
    return (
      technicians.find((t) => t.uid === targetId)?.nome ||
      "Selecione um técnico"
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Disparar Notificações
      </h1>
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        {/* CORREÇÃO 2: O 'onSubmit' foi removido do form. O formulário agora é apenas um container. */}
        <form className="space-y-6">
          <Listbox value={target} onChange={setTarget}>
            <div className="relative">
              <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                Enviar Para
              </Listbox.Label>
              <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {target === "all" ? (
                    <Users className="h-5 w-5 text-gray-500" />
                  ) : (
                    <User className="h-5 w-5 text-gray-500" />
                  )}
                </span>
                <span className="block truncate pl-8">
                  {getTargetName(target)}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                  <Listbox.Option
                    value="all"
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-teal-100 text-teal-900" : "text-gray-900"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          Todos os Técnicos
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                  {technicians.map((tech) => (
                    <Listbox.Option
                      key={tech.uid}
                      value={tech.uid}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-teal-100 text-teal-900" : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {tech.nome}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>

          <Field>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Título da Notificação
            </Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Ex: Lembrete Importante"
            />
          </Field>

          <Field>
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem
            </Label>
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Digite sua mensagem aqui..."
            />
          </Field>

          <div className="flex justify-end">
            {/* CORREÇÃO 3: O 'type' foi mudado para 'button' e adicionamos o 'onClick' */}
            <AppButton
              type="button"
              onClick={handleSendNotification}
              disabled={isLoading}
            >
              <Send size={18} className="mr-2" />
              {isLoading ? "Enviando..." : "Enviar Notificação"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
