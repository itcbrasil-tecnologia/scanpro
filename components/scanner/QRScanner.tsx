"use client";

import { useState, useEffect } from "react";
import { useQRScanner } from "../../hooks/useQRScanner";
import {
  QrCode,
  CameraOff,
  RefreshCw,
  AlertTriangle,
  Play,
} from "lucide-react";

interface QRScannerProps {
  onCodeScanned: (code: string) => void;
}

export function QRScanner({ onCodeScanned }: QRScannerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const scannerElementId = "qr-scanner-container";

  const { isScanning, initError } = useQRScanner({
    elementId: scannerElementId,
    isActive: isActive && isMounted,
    onScanSuccess: (code) => {
      setIsActive(false);
      onCodeScanned(code);
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRestart = () => {
    // FIX: Força o desligamento e religamento para engatilhar o Hook novamente
    setIsActive(false);
    setTimeout(() => setIsActive(true), 100);
  };

  const handleStop = () => setIsActive(false);

  // Identifica se o erro foi apenas o bloqueio do navegador (Not fully active)
  const isAutoPlayBlock =
    initError?.includes("fully active") ||
    initError?.includes("NotAllowedError");

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center w-full max-w-md mx-auto relative rounded-xl overflow-hidden bg-black shadow-2xl border border-zinc-800">
        <div className="w-full min-h-[300px] flex items-center justify-center bg-zinc-900 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto relative rounded-xl overflow-hidden bg-black shadow-2xl border border-zinc-800">
      <div
        id={scannerElementId}
        className="w-full min-h-[300px] bg-zinc-950 relative z-0"
      ></div>

      {/* OVERLAY DE ERRO INTELIGENTE */}
      {initError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-zinc-300 gap-3 bg-zinc-950 z-40 text-center">
          <AlertTriangle
            size={40}
            className={
              isAutoPlayBlock ? "text-amber-500 mb-2" : "text-red-500 mb-2"
            }
          />

          <p className="text-sm font-bold">
            {isAutoPlayBlock ? "Ação Necessária" : "Câmera Bloqueada"}
          </p>

          <p className="text-xs text-zinc-400">
            {isAutoPlayBlock
              ? "O navegador exige que você inicie a câmera manualmente."
              : "O navegador recusou o acesso ao hardware."}
          </p>

          {/* Esconde o log feio se for apenas bloqueio de autoplay */}
          {!isAutoPlayBlock && (
            <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 w-full break-all line-clamp-2">
              {initError}
            </p>
          )}

          <button
            onClick={handleRestart}
            className={`mt-3 flex items-center gap-2 text-white px-5 py-3 rounded-xl transition-colors cursor-pointer font-medium ${
              isAutoPlayBlock
                ? "bg-amber-600 hover:bg-amber-500"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            {isAutoPlayBlock ? <Play size={18} /> : <RefreshCw size={18} />}
            {isAutoPlayBlock ? "Iniciar Câmera" : "Tentar Novamente"}
          </button>
        </div>
      )}

      {/* OVERLAY DE PAUSA */}
      {!isActive && !isScanning && !initError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-zinc-400 gap-4 bg-zinc-950 z-20">
          <CameraOff size={48} className="opacity-50" />
          <p className="text-sm font-medium text-center">Câmera pausada.</p>
          <button
            onClick={handleRestart}
            className="mt-2 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={16} />
            Reativar
          </button>
        </div>
      )}

      {/* Botão Flutuante */}
      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <button
          onClick={isActive ? handleStop : handleRestart}
          className={`p-3 rounded-full backdrop-blur-md shadow-lg transition-all cursor-pointer ${
            isActive
              ? "bg-red-500/90 text-white hover:bg-red-600"
              : "bg-emerald-500/90 text-white hover:bg-emerald-600"
          }`}
        >
          {isActive ? <CameraOff size={20} /> : <QrCode size={20} />}
        </button>
      </div>

      {/* Mira Verde */}
      {isScanning && !initError && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="w-[150px] h-[150px] border-2 border-emerald-500 rounded-2xl flex items-center justify-center relative bg-emerald-500/5">
            <div
              className="absolute w-full h-[2px] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            ></div>
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>
          </div>
        </div>
      )}
    </div>
  );
}
