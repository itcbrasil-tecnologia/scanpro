"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { QRCodeSVG } from "qrcode.react";
import { Printer, X, Download, ArrowDown, ArrowRight } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

interface QrCodePrintModalProps {
  hostnames: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function QrCodePrintModal({
  hostnames,
  isOpen,
  onClose,
}: QrCodePrintModalProps) {
  const [qrSize, setQrSize] = useState(128);
  const [showHostname, setShowHostname] = useState(true);
  const [hostnamePosition, setHostnamePosition] = useState<"bottom" | "right">(
    "bottom"
  );
  const [transparentBg, setTransparentBg] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    toast.loading("Gerando arquivo .zip...", { id: "global-toast" });

    try {
      const zip = new JSZip();

      for (const name of hostnames) {
        const svgElement = document.getElementById(
          `qr-${name}`
        ) as SVGSVGElement | null;
        if (!svgElement) continue;

        const svgXml = new XMLSerializer().serializeToString(svgElement);
        const dataUrl = `data:image/svg+xml;base64,${btoa(svgXml)}`;

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        const padding = 10;
        const textFontSize = 10;
        const textMargin = 5;

        let textWidth = 0;
        if (showHostname) {
          ctx.font = `${textFontSize}px monospace`;
          textWidth = ctx.measureText(name).width;
        }

        if (showHostname && hostnamePosition === "right") {
          canvas.width = qrSize + textWidth + padding * 2 + textMargin;
          canvas.height = qrSize + padding * 2;
        } else {
          canvas.width = qrSize + padding * 2;
          canvas.height =
            qrSize +
            padding * 2 +
            (showHostname ? textFontSize + textMargin : 0);
        }

        if (!transparentBg) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, padding, padding, qrSize, qrSize);

        if (showHostname) {
          ctx.fillStyle = "black";
          ctx.font = `${textFontSize}px monospace`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";

          if (hostnamePosition === "right") {
            ctx.fillText(
              name,
              qrSize + padding + textMargin,
              canvas.height / 2
            );
          } else {
            ctx.textAlign = "center";
            ctx.fillText(
              name,
              canvas.width / 2,
              qrSize + padding + textMargin + textFontSize / 2
            );
          }
        }

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (blob) {
          zip.file(`${name}.png`, blob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "QR_Codes_ScanPRO.zip");
      toast.success("Download iniciado!", { id: "global-toast" });
    } catch (error) {
      console.error("Erro ao gerar ZIP:", error);
      toast.error("Ocorreu um erro ao gerar os ficheiros.", {
        id: "global-toast",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Codes Gerados">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
      <div className="space-y-4">
        <div className="no-print p-4 bg-slate-100 rounded-lg space-y-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-sm text-slate-600">
                Tamanho:
              </span>
              <div className="flex items-center space-x-3">
                {[64, 128, 256].map((size) => (
                  <button
                    key={size}
                    onClick={() => setQrSize(size)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      qrSize === size
                        ? "bg-teal-600 text-white"
                        : "bg-white hover:bg-slate-200"
                    }`}
                  >
                    {size === 64 ? "P" : size === 128 ? "M" : "G"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showHostname"
                checked={showHostname}
                onChange={(e) => setShowHostname(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <label
                htmlFor="showHostname"
                className="ml-2 block text-sm text-slate-700"
              >
                Incluir Hostname
              </label>
            </div>
          </div>
          {showHostname && (
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-sm text-slate-600">
                  Posição:
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setHostnamePosition("bottom")}
                    className={`flex items-center px-3 py-1 text-sm rounded-full ${
                      hostnamePosition === "bottom"
                        ? "bg-teal-600 text-white"
                        : "bg-white hover:bg-slate-200"
                    }`}
                  >
                    <ArrowDown size={14} className="mr-1.5" /> Embaixo
                  </button>
                  <button
                    onClick={() => setHostnamePosition("right")}
                    className={`flex items-center px-3 py-1 text-sm rounded-full ${
                      hostnamePosition === "right"
                        ? "bg-teal-600 text-white"
                        : "bg-white hover:bg-slate-200"
                    }`}
                  >
                    <ArrowRight size={14} className="mr-1.5" /> Direita
                  </button>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="transparentBg"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label
                  htmlFor="transparentBg"
                  className="ml-2 block text-sm text-slate-700"
                >
                  Fundo Transparente (PNG)
                </label>
              </div>
            </div>
          )}
        </div>
        <div
          id="printable-area"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 max-h-[50vh] overflow-y-auto border rounded-lg"
        >
          {hostnames.map((name) => (
            <div
              key={name}
              className={`inline-flex items-center justify-center p-2 border rounded-md break-inside-avoid ${
                hostnamePosition === "bottom"
                  ? "flex-col space-y-1"
                  : "flex-row space-x-2"
              }`}
            >
              <div className="flex-shrink-0">
                <QRCodeSVG
                  id={`qr-${name}`}
                  value={name}
                  size={qrSize}
                  bgColor={transparentBg ? "transparent" : "#FFFFFF"} // CORREÇÃO AQUI
                />
              </div>
              {showHostname && (
                <p
                  className="font-mono text-center"
                  style={{
                    fontSize: "10px",
                    writingMode:
                      hostnamePosition === "right"
                        ? "vertical-rl"
                        : "horizontal-tb",
                  }}
                >
                  {name}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="no-print flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            className="flex items-center justify-center bg-slate-500 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-600 transition-colors"
          >
            <X size={20} className="mr-2" />
            Fechar
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            <Download size={20} className="mr-2" />
            Baixar PNGs
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors"
          >
            <Printer size={20} className="mr-2" />
            Imprimir
          </button>
        </div>
      </div>
    </Modal>
  );
}
