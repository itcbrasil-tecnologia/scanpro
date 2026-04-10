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

  const isTransitioning = useRef(false);

  const onScanSuccessRef = useRef(onScanSuccess);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    isActiveRef.current = isActive;
  }, [onScanSuccess, isActive]);

  const startScanner = useCallback(async () => {
    while (isTransitioning.current) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    isTransitioning.current = true;
    setInitError(null);

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!isActiveRef.current) {
      isTransitioning.current = false;
      return;
    }

    // --- A MÁGICA DO "NUKE": DESTRUIÇÃO DE ESTADO ZUMBI ---
    // Se existe uma instância antiga (mesmo que corrompida), nós a matamos sem dó.
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn(
          "Ignorando falha na instância velha. Forçando limpeza.",
          e,
        );
      } finally {
        // Zera a referência na memória
        scannerRef.current = null;
        // Expurga o HTML injetado no DOM na força bruta (Vanilla JS)
        const container = document.getElementById(elementId);
        if (container) container.innerHTML = "";
      }
    }

    // Criamos um "cérebro" 100% novo e limpo para a biblioteca
    scannerRef.current = new Html5Qrcode(elementId, false);

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
    } finally {
      isTransitioning.current = false;
    }
  }, [elementId]);

  const stopScanner = useCallback(async () => {
    while (isTransitioning.current) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (scannerRef.current) {
      isTransitioning.current = true;
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Ignorando erro ao parar:", err);
      } finally {
        // NUKE DE DESLIGAMENTO: Nunca deixa um zumbi para trás
        scannerRef.current = null;
        const container = document.getElementById(elementId);
        if (container) container.innerHTML = "";

        setIsScanning(false);
        isTransitioning.current = false;
      }
    }
  }, [elementId]);

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
