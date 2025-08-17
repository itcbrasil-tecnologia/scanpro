"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { UserProfile } from "@/types";
import toast from "react-hot-toast";
import { Send, Users, User } from "lucide-react";

export default function NotificacoesPage() {
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const [target, setTarget] = useState("all"); // 'all' ou o UID de um técnico
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Busca a lista de técnicos para preencher o dropdown
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

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Título e mensagem são obrigatórios.");
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Disparar Notificações
      </h1>
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSendNotification} className="space-y-6">
          <div>
            <label
              htmlFor="target"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enviar Para
            </label>
            <div className="flex items-center">
              <span className="mr-3">
                {target === "all" ? (
                  <Users className="h-5 w-5 text-gray-500" />
                ) : (
                  <User className="h-5 w-5 text-gray-500" />
                )}
              </span>
              <select
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm"
              >
                <option value="all">Todos os Técnicos</option>
                {technicians.map((tech) => (
                  <option key={tech.uid} value={tech.uid}>
                    {tech.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Título da Notificação
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Ex: Lembrete Importante"
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mensagem
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Digite sua mensagem aqui..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center bg-teal-600 text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed"
            >
              <Send size={18} className="mr-2" />
              {isLoading ? "Enviando..." : "Enviar Notificação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
