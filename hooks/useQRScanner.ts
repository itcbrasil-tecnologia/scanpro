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
      // 1. FORÇA BRUTA DE RESOLUÇÃO
      // Pede 4K. O WebRTC puro é inteligente: se o celular não tiver 4K,
      // ele entrega 1080p silenciosamente sem dar erro de Overconstrained.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          // @ts-expect-error - O TypeScript ainda não possui a tipagem oficial para focusMode
          advanced: [{ focusMode: "continuous" }],
        },
      });

      streamRef.current = stream;

      // 2. A MÁGICA DO ZOOM NATIVO (O Game Changer)
      // Capturamos a lente que acabou de abrir e verificamos seus poderes.
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() || {};
      const settings = track.getSettings?.() || {};

      // Se o hardware suportar controle de zoom via código
      // @ts-expect-error - A propriedade zoom não existe na interface padrão de MediaTrackCapabilities
      if (capabilities.zoom) {
        // Pega o valor máximo de zoom (Limitamos a 3x para não virar um borrão digital)
        // @ts-expect-error - O TypeScript não sabe que zoom possui a propriedade max
        const maxZoom = Math.min(capabilities.zoom.max || 3, 3);

        // Aqui o TS já reconhece, então não precisamos de ignore
        const currentZoom = settings.zoom || 1;

        if (currentZoom < maxZoom) {
          try {
            await track.applyConstraints({
              // @ts-expect-error - Constraints avançadas de zoom ainda não tipadas oficialmente
              advanced: [{ zoom: maxZoom }],
            });
            console.log("Zoom nativo ativado!");
          } catch (e) {
            console.warn("Hardware recusou aplicar o zoom", e);
          }
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
              // 3. OTIMIZAÇÃO DE MEMÓRIA (Thermal Throttling)
              // Se a câmera abriu em 4K, não podemos passar a imagem inteira pro WASM
              // senão a bateria vai embora em 5 minutos. Nós reduzimos o canvas para no máx 1080p.
              // O zoom nativo já fez o trabalho duro de "aumentar" a etiqueta.
              const maxWidth = 1920;
              const scale = Math.min(1, maxWidth / videoElement.videoWidth);

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
                  onScanSuccessRef.current(results[0].text);
                  stopScanner();
                  break;
                }
              }
            } catch {
              // Ignora frames vazios
            }
            // Fôlego de 100ms (10 FPS) para imagens gigantescas não travarem o navegador
            await new Promise((r) => setTimeout(r, 100));
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
