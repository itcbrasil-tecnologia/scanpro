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

    // CONFIGURAÇÃO SNIPER
    const config = {
      fps: 10, // Mais tempo de CPU por quadro
      qrbox: { width: 170, height: 170 }, // Área um pouco maior para facilitar enquadramento
      // O número 0 é o valor bruto do Enum Html5QrcodeSupportedFormats.QR_CODE.
      // Dribla o bug do Next.js e foca 100% da performance na leitura de matriz 2D.
      formatsToSupport: [0],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true, // Usa API de hardware nativo do Android se disponível
      },
      disableFlip: false,
    };

    const handleSuccess = (decodedText: string) => {
      if (isActiveRef.current && onScanSuccessRef.current) {
        onScanSuccessRef.current(decodedText);
      }
    };

    const handleError = (error: unknown) => {
      if (isActiveRef.current && onScanErrorRef.current) {
        onScanErrorRef.current(String(error));
      }
    };

    try {
      // TENTATIVA 1: O "Sweet Spot" (Full HD)
      // Se o celular suportar, teremos a melhor resolução possível.
      await scannerRef.current.start(
        {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        config,
        handleSuccess,
        handleError,
      );
      setIsScanning(true);
    } catch (err1) {
      console.warn("1080p recusado pelo hardware. Acionando Fallback...", err1);

      try {
        // TENTATIVA 2: Fallback Universal
        // Se o 1080p falhar, captura o erro e pede a câmera padrão sem restrições.
        // Isso garante que a caixinha de PERMISSÃO vai aparecer e a tela preta não ocorrerá.
        await scannerRef.current.start(
          { facingMode: "environment" },
          config,
          handleSuccess,
          handleError,
        );
        setIsScanning(true);
      } catch (err2) {
        console.error("Falha total na inicialização da câmera", err2);
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

  return { isScanning, startScanner, stopScanner };
}
