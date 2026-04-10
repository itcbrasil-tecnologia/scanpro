import { useState, useEffect, useCallback, useRef } from "react";
import { readBarcodesFromImageData, type ReadResult } from "zxing-wasm/reader";

interface UseQRScannerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onScanSuccess: (decodedText: string) => void;
  isActive: boolean;
}

export function useQRScanner({
  videoRef,
  onScanSuccess,
  isActive,
}: UseQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(isActive);
  const onScanSuccessRef = useRef(onScanSuccess);
  const readerRunning = useRef(false);

  useEffect(() => {
    isActiveRef.current = isActive;
    onScanSuccessRef.current = onScanSuccess;
  }, [isActive, onScanSuccess]);

  const stopScanner = useCallback(() => {
    readerRunning.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  }, [videoRef]);

  const startScanner = useCallback(async () => {
    stopScanner();
    setInitError(null);

    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!isActiveRef.current) return;

    try {
      // 1. FORÇA O AUTOFOCO FÍSICO DA LENTE (se o celular suportar)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          // @ts-expect-error - Propriedade avançada que o TS as vezes não reconhece
          advanced: [{ focusMode: "continuous" }],
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        const videoElement = videoRef.current;
        videoElement.srcObject = stream;
        videoElement.setAttribute("playsinline", "true");
        await videoElement.play();

        setIsScanning(true);
        readerRunning.current = true;

        const startReading = async () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });

          while (
            readerRunning.current &&
            videoElement.readyState === videoElement.HAVE_ENOUGH_DATA
          ) {
            try {
              // Prepara o canvas do tamanho exato do frame de vídeo
              canvas.width = videoElement.videoWidth;
              canvas.height = videoElement.videoHeight;

              if (ctx) {
                // Desenha o frame inteiro
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                // 2. FORÇA BRUTA: Pega a imagem TODA, sem recorte.
                // Onde o QR Code estiver batendo no sensor, o WASM vai ler.
                const imageData = ctx.getImageData(
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                );

                const results: ReadResult[] = await readBarcodesFromImageData(
                  imageData,
                  {
                    tryHarder: true, // Força a leitura de códigos difíceis/densos
                    formats: ["QRCode"],
                    maxNumberOfSymbols: 1,
                  },
                );

                if (results && results.length > 0 && results[0].text) {
                  onScanSuccessRef.current(results[0].text);
                  stopScanner();
                  break;
                }
              }
            } catch {
              // Erro de "código não encontrado" é ignorado silenciosamente
            }
            // Mantemos o fôlego de 50ms para a CPU
            await new Promise((r) => setTimeout(r, 50));
          }
        };

        startReading();
      }
    } catch (err) {
      console.error("Falha ao acessar câmera nativa", err);
      setInitError("Erro de Hardware: " + String(err));
      setIsScanning(false);
    }
  }, [videoRef, stopScanner]);

  useEffect(() => {
    if (isActive) startScanner();
    else stopScanner();

    return () => stopScanner();
  }, [isActive, startScanner, stopScanner]);

  return { isScanning, initError, startScanner };
}
