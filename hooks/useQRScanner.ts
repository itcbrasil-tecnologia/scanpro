import { useState, useEffect, useCallback, useRef } from "react";
import jsQR from "jsqr";

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
  const requestRef = useRef<number | null>(null);
  const isActiveRef = useRef(isActive);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    isActiveRef.current = isActive;
    onScanSuccessRef.current = onScanSuccess;
  }, [isActive, onScanSuccess]);

  // Função que para a câmera nativamente e limpa os rastros
  const stopScanner = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  }, [videoRef]);

  // O "Cérebro" do Scanner: Roda a cada frame de vídeo (aprox. 30 a 60 vezes por segundo)
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !isActiveRef.current) return;

    const video = videoRef.current;

    // Só processa se o vídeo tiver carregado dados suficientes
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Cria um canvas na memória (invisível) para extrair a imagem
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // OTIMIZAÇÃO SNIPER: Vamos recortar apenas o centro da tela (400x400)
        // Isso economiza 80% do processamento do celular e foca apenas na mira verde
        const cropSize = 400;
        const startX = Math.max(0, (canvas.width - cropSize) / 2);
        const startY = Math.max(0, (canvas.height - cropSize) / 2);

        const imageData = ctx.getImageData(startX, startY, cropSize, cropSize);

        // A matemática do jsQR entra em ação
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert", // Mantém rápido
        });

        if (code && code.data) {
          onScanSuccessRef.current(code.data);
          stopScanner(); // Para imediatamente após ler
          return;
        }
      }
    }

    // Se não achou código, pede pro navegador rodar a função de novo no próximo frame
    requestRef.current = requestAnimationFrame(scanFrame);
  }, [videoRef, stopScanner]);

  const startScanner = useCallback(async () => {
    stopScanner();
    setInitError(null);

    // Pequeno delay para garantir fluidez do React
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!isActiveRef.current) return;

    try {
      // CHAMA A CÂMERA NATIVA (Pedindo HD - 720p)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // O playsInline é OBRIGATÓRIO para o iOS não abrir o vídeo em tela cheia
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();

        setIsScanning(true);
        // Dispara o loop de leitura de frames
        requestRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.error("Falha ao acessar câmera nativa", err);
      setInitError("Erro de Hardware: " + String(err));
      setIsScanning(false);
    }
  }, [videoRef, stopScanner, scanFrame]);

  useEffect(() => {
    if (isActive) startScanner();
    else stopScanner();

    return () => stopScanner(); // Cleanup ao desmontar
  }, [isActive, startScanner, stopScanner]);

  return { isScanning, initError, startScanner };
}
