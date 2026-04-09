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
      scannerRef.current = new Html5Qrcode(elementId, false);
    }

    try {
      // Pedimos apenas a câmera traseira, SEM impor resolução.
      // Isso garante que não haverá OverconstrainedError e a câmera abrirá.
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 15,
          // Box menor atua como um crop/zoom para ler as micro-etiquetas.
          qrbox: { width: 150, height: 150 },
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
