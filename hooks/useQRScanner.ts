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
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanErrorRef.current = onScanError;
    isActiveRef.current = isActive;
  }, [onScanSuccess, onScanError, isActive]);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(elementId);
    }

    try {
      await scannerRef.current.start(
        {
          facingMode: "environment",
          // MÁGICA AQUI: Exige a resolução máxima (4K/2K) para garantir
          // densidade de pixels ao ler micro-etiquetas de 12mm de longe.
          // Usamos "ideal" em vez de "exact" para não quebrar em celulares mais fracos.
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
        {
          fps: 15, // Aumentamos para 15 FPS para capturar o instante exato do foco
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText: string) => {
          if (isActiveRef.current && onScanSuccessRef.current) {
            onScanSuccessRef.current(decodedText);
          }
        },
        (error: unknown) => {
          if (isActiveRef.current && onScanErrorRef.current) {
            onScanErrorRef.current(String(error));
          }
        },
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Falha ao iniciar a câmera para QR", err);
      setIsScanning(false);
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

  return { isScanning, startScanner, stopScanner };
}
