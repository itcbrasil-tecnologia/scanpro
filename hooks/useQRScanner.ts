import { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface UseQRScannerProps {
  elementId: string;
  onScanSuccess: (decodedText: string) => void;
  isActive: boolean;
}

export function useQRScanner({
  elementId,
  onScanSuccess,
  isActive,
}: UseQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
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

    // Fôlego de 300ms para evitar a restrição "Document not fully active"
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!isActiveRef.current) return;

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

    const handleFrameError = () => {};

    try {
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
      // FIX: Removido o 'err1' inútil. Apenas usamos catch para o Fallback.
    } catch {
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          handleSuccess,
          handleFrameError,
        );
        setIsScanning(true);
      } catch (err2) {
        console.error("Falha fatal na inicialização:", err2);
        setInitError(String(err2));
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
