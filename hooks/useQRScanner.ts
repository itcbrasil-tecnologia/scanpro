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

  // A MÁGICA AQUI: O Mutex (Trava de Transição)
  // Garante que a câmera nunca tente ligar enquanto está desligando e vice-versa.
  const isTransitioning = useRef(false);

  const onScanSuccessRef = useRef(onScanSuccess);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    isActiveRef.current = isActive;
  }, [onScanSuccess, isActive]);

  const startScanner = useCallback(async () => {
    // 1. FILA DE ESPERA: Se a câmera estiver processando outra ordem, aguarda em loop.
    while (isTransitioning.current) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // 2. BLOQUEIA A PORTA: Nenhuma outra função pode mexer na câmera agora.
    isTransitioning.current = true;
    setInitError(null);

    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!isActiveRef.current) {
      isTransitioning.current = false; // Libera a porta antes de sair
      return;
    }

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(elementId, false);
    }

    // Se por algum motivo já estiver escaneando nativamente, apenas atualiza o estado
    if (scannerRef.current.isScanning) {
      setIsScanning(true);
      isTransitioning.current = false;
      return;
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
      // 3. ABRE A PORTA: O processo de ligar terminou.
      isTransitioning.current = false;
    }
  }, [elementId]);

  const stopScanner = useCallback(async () => {
    // 1. FILA DE ESPERA: Se estiver ligando, espera terminar para poder desligar.
    while (isTransitioning.current) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (scannerRef.current && scannerRef.current.isScanning) {
      // 2. BLOQUEIA A PORTA
      isTransitioning.current = true;
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error("Falha ao parar a câmera", err);
      } finally {
        // 3. ABRE A PORTA
        isTransitioning.current = false;
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
