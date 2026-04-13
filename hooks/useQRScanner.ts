import { useState, useEffect, useCallback, useRef } from "react";
import { readBarcodesFromImageData, type ReadResult } from "zxing-wasm/reader";

interface UseQRScannerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onScanSuccess: (decodedText: string) => void;
  isActive: boolean;
  scanMode: "qr" | "barcode"; // NOVO: Prop para o modo de leitura
}

export function useQRScanner({
  videoRef,
  onScanSuccess,
  isActive,
  scanMode,
}: UseQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Estados da Lanterna
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(isActive);
  const onScanSuccessRef = useRef(onScanSuccess);
  const readerRunning = useRef(false);

  // Ref dinâmico para o modo de leitura (permite trocar sem reiniciar a câmera)
  const scanModeRef = useRef(scanMode);

  const lastCodeRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);
  const COOLDOWN_MS = 2000;

  useEffect(() => {
    isActiveRef.current = isActive;
    onScanSuccessRef.current = onScanSuccess;
    scanModeRef.current = scanMode; // Atualiza silenciosamente
  }, [isActive, onScanSuccess, scanMode]);

  const stopScanner = useCallback(() => {
    readerRunning.current = false;
    setIsTorchOn(false);
    setHasTorch(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        // Tenta apagar a lanterna antes de matar a track
        try {
          // @ts-expect-error
          track.applyConstraints({ advanced: [{ torch: false }] });
        } catch (e) {}
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  }, [videoRef]);

  // Função para o botão da Lanterna
  const toggleTorch = useCallback(async () => {
    if (streamRef.current && hasTorch) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        const newState = !isTorchOn;
        // @ts-expect-error - A propriedade torch não é tipada nativamente no TS
        await track.applyConstraints({ advanced: [{ torch: newState }] });
        setIsTorchOn(newState);
      } catch (e) {
        console.warn("Falha ao alternar lanterna", e);
      }
    }
  }, [hasTorch, isTorchOn]);

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
          // @ts-expect-error
          advanced: [{ focusMode: "continuous" }],
        },
      });

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() || {};

      // Verifica se o celular suporta ligar a lanterna via web
      // @ts-expect-error
      if (capabilities.torch) {
        setHasTorch(true);
      }

      // @ts-expect-error
      if (capabilities.zoom) {
        // @ts-expect-error
        const maxZoom = Math.min(capabilities.zoom.max || 3, 3);
        try {
          // @ts-expect-error
          await track.applyConstraints({ advanced: [{ zoom: maxZoom }] });
        } catch (e) {
          console.warn(e);
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

                // NOVO: Lê o ref para saber qual formato procurar neste frame exato
                const formatsToRead =
                  scanModeRef.current === "qr"
                    ? ["QRCode"]
                    : ["Code128", "Code39"];

                const results: ReadResult[] = await readBarcodesFromImageData(
                  imageData,
                  {
                    tryHarder: true,
                    formats: formatsToRead, // Injeta o formato dinamicamente
                    maxNumberOfSymbols: 1,
                  },
                );

                if (results && results.length > 0 && results[0].text) {
                  const code = results[0].text;
                  const now = Date.now();

                  if (
                    code !== lastCodeRef.current ||
                    now - lastTimeRef.current > COOLDOWN_MS
                  ) {
                    lastCodeRef.current = code;
                    lastTimeRef.current = now;
                    onScanSuccessRef.current(code);
                  }
                }
              }
            } catch {}
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

  return {
    isScanning,
    initError,
    startScanner,
    hasTorch,
    isTorchOn,
    toggleTorch,
  };
}
