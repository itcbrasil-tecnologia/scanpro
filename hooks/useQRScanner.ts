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
          // Reduzido para Full HD. Garante altíssima densidade de pixels
          // para a micro-etiqueta, sem travar o WebRTC do navegador.
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        {
          fps: 10, // Retornamos para 10 FPS para dar mais tempo de processamento à CPU
          qrbox: { width: 250, height: 250 },
          // REMOVIDO: aspectRatio: 1.0 -> Forçar proporção quadrada em vídeo 16:9 causa tela preta em celulares
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
      // Se falhar de novo, passa o erro para frente para não ficar silencioso
      if (isActiveRef.current && onScanErrorRef.current) {
        onScanErrorRef.current("Erro de hardware: " + String(err));
      }
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
