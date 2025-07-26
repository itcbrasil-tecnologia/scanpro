"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Modal } from "./Modal";
import toast from "react-hot-toast";

interface DeviceHistoryModalProps {
  hostname: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ConferenceHistory {
  id: string;
  date: string;
  technician: string;
  status: "Faltante"; // Atualmente, só podemos rastrear quando um dispositivo faltou.
}

export function DeviceHistoryModal({
  hostname,
  isOpen,
  onClose,
}: DeviceHistoryModalProps) {
  const [history, setHistory] = useState<ConferenceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!hostname) return;

      setIsLoading(true);
      try {
        // NOTA TÉCNICA: Esta consulta busca conferências onde o dispositivo foi marcado como FALTANTE.
        // O modelo de dados atual armazena `missingDevices` como um array no documento da conferência.
        // Para um histórico completo (incluindo quando foi escaneado), seria necessária uma mudança
        // no modelo de dados, como ter um subcoleção de "eventos" por dispositivo.
        const q = query(
          collection(db, "conferences"),
          where("missingDevices", "array-contains", hostname),
          orderBy("endTime", "desc")
        );

        const querySnapshot = await getDocs(q);
        const historyData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.endTime.toDate().toLocaleDateString("pt-BR"),
            technician: data.userName,
            status: "Faltante",
          } as ConferenceHistory;
        });

        setHistory(historyData);
      } catch (error) {
        console.error("Erro ao buscar histórico do dispositivo:", error);
        toast.error("Não foi possível carregar o histórico do dispositivo.", {
          id: "global-toast",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchHistory();
    }
  }, [hostname, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Histórico do Dispositivo`}>
      <div className="space-y-4">
        <p className="font-mono text-center bg-slate-100 p-2 rounded-md text-slate-700">
          {hostname}
        </p>
        {isLoading ? (
          <p className="text-center text-slate-500">Buscando histórico...</p>
        ) : history.length > 0 ? (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {history.map((item) => (
              <li
                key={item.id}
                className="p-3 bg-slate-50 rounded-md flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{item.date}</p>
                  <p className="text-sm text-slate-600">
                    Conferência por: {item.technician}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-bold text-red-800 bg-red-100 rounded-full">
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-slate-500 py-4">
            Nenhum registro de pendência encontrado para este dispositivo.
          </p>
        )}
      </div>
    </Modal>
  );
}
