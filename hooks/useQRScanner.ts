import { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface UseQRScannerProps {
  elementId: string;
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isActive: boolean;
}

export function useQRScanner({
  elementId,
  onScanSuccess,
  onScanError,
  isActive,
}: UseQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  // NOVO: Estado para capturar o motivo da tela preta
  const [initError, setInitError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const onScanSuccessRef = useRef(onScanSuccess);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    isActiveRef.current = isActive;
  }, [onScanSuccess, isActive]);

  const startScanner = useCallback(async () => {
    setInitError(null);
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(elementId, false);
    }

    const config = {
      fps: 10,
      qrbox: { width: 150, height: 150 },
      disableFlip: false,
    };

    const handleSuccess = (decodedText: string) => {
      if (isActiveRef.current && onScanSuccessRef.current) {
        onScanSuccessRef.current(decodedText);
      }
    };

    // Ignora os alertas de "frame vazio" para não poluir o terminal
    const handleFrameError = () => {};

    try {
      // TENTATIVA 1: O Ponto Ideal (HD Seguro - 720p).
      // Garante a nitidez para a etiqueta, mas não sofre o bloqueio do 1080p/4K.
      await scannerRef.current.start(
        {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        config,
        handleSuccess,
        handleFrameError,
      );
      setIsScanning(true);
    } catch (err1) {
      console.warn("HD recusado. Acionando Fallback de Segurança...", err1);

      try {
        // TENTATIVA 2: Fallback Universal
        // Se o HD falhar, pede a câmera do jeito mais básico possível.
        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          handleSuccess,
          handleFrameError,
        );
        setIsScanning(true);
      } catch (err2) {
        console.error("Falha fatal na inicialização:", err2);
        setInitError(String(err2)); // Salva o erro para mostrar na tela
        setIsScanning(false);
      }
    }
  }, [elementId]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error("Falha ao parar a câmera", err);
      }
    }
  }, []);

  useEffect(() => {
    if (isActive && !isScanning) {
      startScanner();
    } else if (!isActive && isScanning) {
      stopScanner();
    }

    return () => {
      if (scannerRef.current?.isScanning) {
        stopScanner();
      }
    };
  }, [isActive, startScanner, stopScanner, isScanning]);

  return { isScanning, startScanner, stopScanner, initError };
}
