"use client";

import { useState, useEffect, useRef } from "react";
import { useQRScanner } from "../../hooks/useQRScanner";
import { QrCode, CameraOff, RefreshCw, AlertTriangle } from "lucide-react";

interface QRScannerProps {
  onCodeScanned: (code: string) => void;
}

export function QRScanner({ onCodeScanned }: QRScannerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // A Referência física para a tag de vídeo
  const videoRef = useRef<HTMLVideoElement>(null);

  const { isScanning, initError } = useQRScanner({
    videoRef, // Passamos a referência em vez de um ID de div
    isActive: isActive && isMounted,
    onScanSuccess: (code) => {
      onCodeScanned(code);
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRestart = () => {
    setIsActive(false);
    setTimeout(() => setIsActive(true), 100);
  };

  const handleStop = () => setIsActive(false);

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center w-full max-w-md mx-auto relative rounded-xl overflow-hidden bg-black shadow-2xl border border-zinc-800">
        <div className="w-full min-h-[300px] flex items-center justify-center bg-zinc-900 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto relative rounded-xl overflow-hidden bg-black shadow-2xl border border-zinc-800">
      {/* O CORAÇÃO DO PLANO B: TAG DE VÍDEO NATIVA */}
      <div className="w-full min-h-[300px] bg-zinc-950 relative z-0 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
      </div>

      {/* OVERLAY DE ERRO */}
      {initError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-zinc-300 gap-3 bg-zinc-950 z-40 text-center">
          <AlertTriangle size={40} className="text-red-500 mb-2" />
          <p className="text-sm font-bold">Câmera Bloqueada</p>
          <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 w-full break-all line-clamp-2">
            {initError}
          </p>
          <button
            onClick={handleRestart}
            className="mt-3 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-xl transition-colors cursor-pointer font-medium"
          >
            <RefreshCw size={18} />
            Tentar Novamente
          </button>
        </div>
      )}

      {/* OVERLAY DE PAUSA */}
      {!isActive && !isScanning && !initError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-zinc-400 gap-4 bg-zinc-950/80 backdrop-blur-sm z-20">
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
          <div className="w-[150px] h-[150px] border-2 border-emerald-500 rounded-2xl flex items-center justify-center relative bg-emerald-500/10">
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
