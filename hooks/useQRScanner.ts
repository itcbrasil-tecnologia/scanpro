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

  // Controle do loop de leitura WebAssembly
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
      // Abre a câmera HD nativamente
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
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

        // O MOTOR ZXING-WASM COM CORTE OTIMIZADO
        const startReading = async () => {
          // Cria o canvas invisível na memória
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });

          while (
            readerRunning.current &&
            videoElement.readyState === videoElement.HAVE_ENOUGH_DATA
          ) {
            try {
              canvas.width = videoElement.videoWidth;
              canvas.height = videoElement.videoHeight;

              if (ctx) {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                // OTIMIZAÇÃO: Recorta apenas um quadrado de 400x400 no centro.
                // Isso evita que o WASM processe o teto, o chão e os dedos do usuário,
                // focando 100% da CPU apenas na etiqueta.
                const cropSize = 400;
                const startX = Math.max(0, (canvas.width - cropSize) / 2);
                const startY = Math.max(0, (canvas.height - cropSize) / 2);

                const imageData = ctx.getImageData(
                  startX,
                  startY,
                  cropSize,
                  cropSize,
                );

                // O Motor WASM tenta ler os pixels puros do recorte
                const results: ReadResult[] = await readBarcodesFromImageData(
                  imageData,
                  {
                    tryHarder: true, // Aciona a inteligência avançada para códigos borrados
                    formats: ["QRCode"],
                    maxNumberOfSymbols: 1,
                  },
                );

                // Se achou texto, comemora e desliga!
                if (results && results.length > 0 && results[0].text) {
                  onScanSuccessRef.current(results[0].text);
                  stopScanner();
                  break;
                }
              }
            } catch {
              // Erros normais de "código não encontrado nesse frame" são ignorados
            }
            // Dá um fôlego de 50ms para a CPU do celular não fritar
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
