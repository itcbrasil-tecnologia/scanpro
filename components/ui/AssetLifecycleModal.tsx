"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { Modal } from "./Modal";
import {
  Calendar,
  User,
  Wrench,
  PlusCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface LifecycleEvent {
  id: string;
  timestamp: Timestamp;
  user?: string;
  eventType:
    | "Criação"
    | "Manutenção"
    | "Operacional"
    | "Conferência - Sucesso"
    | "Conferência - Faltante";
  details: string;
}

interface AssetLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: {
    id: string;
    hostname: string;
    serialNumber?: string;
    assetTag?: string;
  } | null;
}

const eventIcons = {
  Criação: <PlusCircle className="h-5 w-5 text-white" />,
  Manutenção: <Wrench className="h-5 w-5 text-white" />,
  Operacional: <CheckCircle className="h-5 w-5 text-white" />,
  "Conferência - Sucesso": <CheckCircle className="h-5 w-5 text-white" />,
  "Conferência - Faltante": <AlertCircle className="h-5 w-5 text-white" />,
};

const eventColors = {
  Criação: "bg-blue-500",
  Manutenção: "bg-amber-500",
  Operacional: "bg-green-500",
  "Conferência - Sucesso": "bg-green-500",
  "Conferência - Faltante": "bg-red-500",
};

export function AssetLifecycleModal({
  isOpen,
  onClose,
  notebook,
}: AssetLifecycleModalProps) {
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLifecycleEvents = async () => {
      if (!notebook?.id) return;

      setIsLoading(true);
      try {
        const eventsQuery = query(
          collection(db, "notebooks", notebook.id, "lifecycleEvents"),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(eventsQuery);
        const eventsData = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as LifecycleEvent)
        );
        setEvents(eventsData);
      } catch (error) {
        console.error("Erro ao buscar histórico do ativo:", error);
        toast.error("Não foi possível carregar o histórico do ativo.", {
          id: "global-toast",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchLifecycleEvents();
    }
  }, [isOpen, notebook]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes e Histórico do Ativo"
    >
      <div className="space-y-4">
        <div className="bg-slate-100 p-3 rounded-lg text-slate-700 space-y-2 dark:bg-zinc-900 dark:text-zinc-300">
          <h3 className="font-mono text-center text-lg dark:text-zinc-100">
            {notebook?.hostname}
          </h3>
          <div className="flex justify-around text-sm">
            <p>
              <strong className="font-semibold">S/N:</strong>{" "}
              {notebook?.serialNumber || "N/A"}
            </p>
            <p>
              <strong className="font-semibold">Patrimônio:</strong>{" "}
              {notebook?.assetTag || "N/A"}
            </p>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto pr-2">
          <h4 className="font-bold text-slate-800 mb-4 dark:text-zinc-100">
            Linha do Tempo de Eventos
          </h4>
          {isLoading ? (
            <p className="text-center text-slate-500 py-4 dark:text-zinc-400">
              Carregando histórico...
            </p>
          ) : events.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-4 dark:border-zinc-700">
              {events.map((event) => (
                <div key={event.id} className="mb-8 flex items-center">
                  <div
                    className={`absolute -left-4 z-10 flex items-center justify-center h-8 w-8 rounded-full ${
                      eventColors[event.eventType]
                    }`}
                  >
                    {eventIcons[event.eventType]}
                  </div>
                  <div className="ml-10 p-4 bg-slate-50 rounded-lg w-full dark:bg-zinc-700/50">
                    <p className="font-bold text-slate-800 dark:text-zinc-100">
                      {event.eventType}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-zinc-300">
                      {event.details}
                    </p>
                    <div className="flex items-center text-xs text-slate-500 mt-2 space-x-4 dark:text-zinc-400">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1.5" />
                        <span>
                          {event.timestamp.toDate().toLocaleString("pt-BR")}
                        </span>
                      </div>
                      {event.user && (
                        <div className="flex items-center">
                          <User size={14} className="mr-1.5" />
                          <span>{event.user}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-4 dark:text-zinc-400">
              Nenhum evento registrado para este ativo.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
