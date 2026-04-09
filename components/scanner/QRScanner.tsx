"use client";

import { useState, useEffect } from "react";
import { useQRScanner } from "../../hooks/useQRScanner";
import { QrCode, CameraOff, RefreshCw } from "lucide-react";

interface QRScannerProps {
  onCodeScanned: (code: string) => void;
}

export function QRScanner({ onCodeScanned }: QRScannerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const scannerElementId = "qr-scanner-container";

  const { isScanning } = useQRScanner({
    elementId: scannerElementId,
    isActive: isActive && isMounted,
    onScanSuccess: (code) => {
      setIsActive(false);
      onCodeScanned(code);
    },
    onScanError: () => {},
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRestart = () => setIsActive(true);
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
      {/* O SEGREDO DA CORREÇÃO: 
        Este div DEVE ficar 100% vazio. O React não pode ter filhos aqui, 
        senão ele apaga o vídeo gerado pelo html5-qrcode.
      */}
      <div
        id={scannerElementId}
        className="w-full min-h-[300px] bg-zinc-950 relative z-0"
      ></div>

      {/* OVERLAYS VISUAIS (Devem ficar FORA do div do scanner, sobrepostos via CSS absolute) */}

      {!isActive && !isScanning && (
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

      {/* Botão Flutuante Superior */}
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

      {/* Mira Verde (Só aparece se a câmera injetou o vídeo) */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          {/* Box reduzido para 150px para forçar aproximação e zoom */}
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
