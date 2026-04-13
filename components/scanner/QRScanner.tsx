"use client";

import { useState, useEffect, useRef } from "react";
import { useQRScanner } from "../../hooks/useQRScanner";
// Adicionado ícones de Flashlight e Barcode
import {
  CameraOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Flashlight,
  FlashlightOff,
  Barcode,
} from "lucide-react";

interface QRScannerProps {
  onCodeScanned: (code: string) => void;
}

export function QRScanner({ onCodeScanned }: QRScannerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  // Estado para controlar a chave (Toggle) de modo de leitura
  const [scanMode, setScanMode] = useState<"qr" | "barcode">("qr");

  const videoRef = useRef<HTMLVideoElement>(null);

  // Passamos o scanMode para o Hook
  const { isScanning, initError, hasTorch, isTorchOn, toggleTorch } =
    useQRScanner({
      videoRef,
      isActive: isActive && isMounted,
      scanMode,
      onScanSuccess: (code) => {
        setShowSuccessFlash(true);
        setTimeout(() => setShowSuccessFlash(false), 600);
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

  if (!isMounted) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto relative rounded-xl overflow-hidden bg-black shadow-2xl border border-zinc-800">
      <div className="w-full min-h-[300px] bg-zinc-950 relative z-0 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {showSuccessFlash && (
          <div className="absolute inset-0 bg-emerald-500/40 backdrop-blur-[2px] z-50 flex items-center justify-center animate-in fade-in duration-200">
            <CheckCircle2 size={60} className="text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* TOGGLE MODO DE LEITURA (QR vs Barras) */}
      <div className="absolute top-4 left-4 z-30 flex bg-zinc-900/80 backdrop-blur-md p-1 rounded-lg border border-zinc-700/50">
        <button
          onClick={() => setScanMode("qr")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            scanMode === "qr"
              ? "bg-emerald-500 text-white shadow"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <QrCode size={14} />
          QR
        </button>
        <button
          onClick={() => setScanMode("barcode")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            scanMode === "barcode"
              ? "bg-emerald-500 text-white shadow"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Barcode size={14} />
          Barras
        </button>
      </div>

      {/* BOTÕES FLUTUANTES (Lanterna e Câmera) */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        {/* Só mostra a lanterna se o celular suportar e a câmera estiver ativa */}
        {hasTorch && isScanning && !initError && (
          <button
            onClick={toggleTorch}
            className={`p-3 rounded-full backdrop-blur-md shadow-lg transition-all cursor-pointer ${
              isTorchOn
                ? "bg-amber-400 text-amber-950 hover:bg-amber-300"
                : "bg-zinc-800/90 text-white hover:bg-zinc-700"
            }`}
          >
            {isTorchOn ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
          </button>
        )}

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

      {isScanning && !initError && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          {/* A Mira muda de formato dependendo do modo selecionado */}
          <div
            className={`border-2 border-emerald-500/50 flex items-center justify-center relative transition-all duration-300 ${
              scanMode === "qr"
                ? "w-[180px] h-[180px] rounded-2xl"
                : "w-[240px] h-[100px] rounded-xl"
            }`}
          >
            <div
              className={`absolute top-0 left-0 border-t-4 border-l-4 border-emerald-500 ${scanMode === "qr" ? "w-6 h-6 rounded-tl-lg" : "w-4 h-4 rounded-tl-md"}`}
            ></div>
            <div
              className={`absolute top-0 right-0 border-t-4 border-r-4 border-emerald-500 ${scanMode === "qr" ? "w-6 h-6 rounded-tr-lg" : "w-4 h-4 rounded-tr-md"}`}
            ></div>
            <div
              className={`absolute bottom-0 left-0 border-b-4 border-l-4 border-emerald-500 ${scanMode === "qr" ? "w-6 h-6 rounded-bl-lg" : "w-4 h-4 rounded-bl-md"}`}
            ></div>
            <div
              className={`absolute bottom-0 right-0 border-b-4 border-r-4 border-emerald-500 ${scanMode === "qr" ? "w-6 h-6 rounded-br-lg" : "w-4 h-4 rounded-br-md"}`}
            ></div>

            {/* Linha de Scanner (Animação) */}
            <div
              className="absolute w-full h-[2px] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            ></div>
          </div>
        </div>
      )}

      {/* Mensagens de Erro... (MANTIDO O MESMO CÓDIGO) */}
      {initError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-zinc-300 gap-3 bg-zinc-950 z-40 text-center">
          <AlertTriangle size={40} className="text-red-500 mb-2" />
          <p className="text-sm font-bold">Câmera Bloqueada</p>
          <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 w-full break-all line-clamp-2">
            {initError}
          </p>
          <button
            onClick={handleRestart}
            className="mt-3 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-xl transition-colors font-medium"
          >
            <RefreshCw size={18} /> Tentar Novamente
          </button>
        </div>
      )}

      {!isActive && !isScanning && !initError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-zinc-400 gap-4 bg-zinc-950/80 backdrop-blur-sm z-20">
          <CameraOff size={48} className="opacity-50" />
          <p className="text-sm font-medium text-center">Câmera pausada.</p>
          <button
            onClick={handleRestart}
            className="mt-2 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={16} /> Reativar
          </button>
        </div>
      )}
    </div>
  );
}
