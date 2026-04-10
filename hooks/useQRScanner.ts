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

  // Lógica de Antiduplicação (Cooldown)
  const lastCodeRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);
  const COOLDOWN_MS = 2000; // Tempo de espera para ler o MESMO código novamente

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          // @ts-expect-error - Foco contínuo para micro-etiquetas
          advanced: [{ focusMode: "continuous" }],
        },
      });

      streamRef.current = stream;

      // Aplicar Zoom Nativo se disponível
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() || {};

      // @ts-expect-error - A propriedade zoom não existe na tipagem padrao do dom
      if (capabilities.zoom) {
        // @ts-expect-error - TypeScript nao reconhece a propriedade max interna do zoom
        const maxZoom = Math.min(capabilities.zoom.max || 3, 3);
        try {
          // @ts-expect-error - Constraints de zoom avancadas ainda nao possuem tipagem
          await track.applyConstraints({ advanced: [{ zoom: maxZoom }] });
        } catch (e) {
          console.warn("Hardware recusou aplicar o zoom", e);
        }
      }

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
              const scale = Math.min(1, 1920 / videoElement.videoWidth);
              canvas.width = videoElement.videoWidth * scale;
              canvas.height = videoElement.videoHeight * scale;

              if (ctx) {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(
                  0,
                  0,
                  canvas.width,
                  canvas.height,
                );
                const results: ReadResult[] = await readBarcodesFromImageData(
                  imageData,
                  {
                    tryHarder: true,
                    formats: ["QRCode"],
                    maxNumberOfSymbols: 1,
                  },
                );

                if (results && results.length > 0 && results[0].text) {
                  const code = results[0].text;
                  const now = Date.now();

                  // MÁGICA DO MODO CONTÍNUO:
                  // Só emite sucesso se for um código novo OU se já passou o tempo de cooldown
                  if (
                    code !== lastCodeRef.current ||
                    now - lastTimeRef.current > COOLDOWN_MS
                  ) {
                    lastCodeRef.current = code;
                    lastTimeRef.current = now;
                    onScanSuccessRef.current(code);
                    // REMOVIDO: stopScanner() -> O vídeo continua rodando!
                  }
                }
              }
            } catch {
              /* erro silencioso de leitura */
            }
            await new Promise((r) => setTimeout(r, 100));
          }
        };
        startReading();
      }
    } catch (err) {
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
