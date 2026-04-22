import { useState, useEffect, useCallback, useRef } from "react";
import { readBarcodesFromImageData, type ReadResult } from "zxing-wasm/reader";

interface UseQRScannerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onScanSuccess: (decodedText: string) => void;
  isActive: boolean;
  scanMode: "qr" | "barcode";
}

export function useQRScanner({
  videoRef,
  onScanSuccess,
  isActive,
  scanMode,
}: UseQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(isActive);
  const onScanSuccessRef = useRef(onScanSuccess);
  const readerRunning = useRef(false);

  const scanModeRef = useRef(scanMode);
  const lastCodeRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);
  const COOLDOWN_MS = 2000;

  useEffect(() => {
    isActiveRef.current = isActive;
    onScanSuccessRef.current = onScanSuccess;
    scanModeRef.current = scanMode;
  }, [isActive, onScanSuccess, scanMode]);

  const stopScanner = useCallback(() => {
    readerRunning.current = false;
    setIsTorchOn(false);
    setHasTorch(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          // @ts-expect-error - A propriedade torch nao possui tipagem nativa no DOM
          track.applyConstraints({ advanced: [{ torch: false }] });
        } catch {}
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  }, [videoRef]);

  const toggleTorch = useCallback(async () => {
    if (streamRef.current && hasTorch) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        const newState = !isTorchOn;
        // @ts-expect-error - A propriedade torch nao possui tipagem nativa no DOM
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
          // @ts-expect-error - FocusMode continuo nao possui tipagem nativa no DOM
          advanced: [{ focusMode: "continuous" }],
        },
      });

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() || {};

      // @ts-expect-error - Torch nao possui tipagem nativa na interface de capabilities
      if (capabilities.torch) {
        setHasTorch(true);
      }

      // @ts-expect-error - Zoom nao possui tipagem nativa na interface de capabilities
      if (capabilities.zoom) {
        // @ts-expect-error - A propriedade max do zoom tambem nao possui tipagem
        const maxZoom = Math.min(capabilities.zoom.max || 3, 3);
        try {
          // @ts-expect-error - Constraints avancadas de zoom nao sao tipadas
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
              if (ctx) {
                let imageData;
                const isQRCode = scanModeRef.current === "qr";

                if (isQRCode) {
                  // MODO QR CODE (PADRÃO): Comprime a tela toda para máxima área de busca
                  const scale = Math.min(1, 1920 / videoElement.videoWidth);
                  canvas.width = videoElement.videoWidth * scale;
                  canvas.height = videoElement.videoHeight * scale;

                  ctx.drawImage(
                    videoElement,
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                  );
                  imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                  );
                } else {
                  // MODO BARRAS (ALTERNATIVO): Recorte 1:1 no centro para nitidez extrema
                  const cropWidth = Math.min(videoElement.videoWidth, 1200);
                  const cropHeight = Math.min(videoElement.videoHeight, 400);

                  canvas.width = cropWidth;
                  canvas.height = cropHeight;

                  const startX = (videoElement.videoWidth - cropWidth) / 2;
                  const startY = (videoElement.videoHeight - cropHeight) / 2;

                  ctx.drawImage(
                    videoElement,
                    startX,
                    startY,
                    cropWidth,
                    cropHeight,
                    0,
                    0,
                    cropWidth,
                    cropHeight,
                  );
                  imageData = ctx.getImageData(0, 0, cropWidth, cropHeight);
                }

                const results: ReadResult[] = await readBarcodesFromImageData(
                  imageData,
                  {
                    tryHarder: true,
                    formats: isQRCode ? ["QRCode"] : ["Code128", "Code39"],
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
