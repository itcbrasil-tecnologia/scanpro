"use client";

import React, { useState, Fragment } from "react";
import { Modal } from "./Modal";
import { QRCodeSVG } from "qrcode.react";
import { Printer, X, Download, ArrowDown, ArrowRight } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import { AppButton } from "./AppButton";
import { RadioGroup, Switch } from "@headlessui/react";

interface QrCodePrintModalProps {
  hostnames: string[];
  isOpen: boolean;
  onClose: () => void;
}

const sizeOptions = [
  { name: "P", value: 64 },
  { name: "M", value: 128 },
  { name: "G", value: 256 },
];

const positionOptions = [
  { name: "Embaixo", value: "bottom", icon: ArrowDown },
  { name: "Direita", value: "right", icon: ArrowRight },
];

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
      toast.error("Ocorreu um erro ao gerar os arquivos.", {
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
          <RadioGroup
            value={qrSize}
            onChange={setQrSize}
            className="flex justify-between items-center w-full"
          >
            <RadioGroup.Label className="font-semibold text-sm text-slate-600">
              Tamanho:
            </RadioGroup.Label>
            <div className="flex items-center space-x-2">
              {sizeOptions.map((option) => (
                <RadioGroup.Option
                  key={option.name}
                  value={option.value}
                  as={Fragment}
                >
                  {({ checked }) => (
                    <button
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        checked
                          ? "bg-teal-600 text-white ring-2 ring-offset-2 ring-teal-600"
                          : "bg-white hover:bg-slate-200"
                      }`}
                    >
                      {option.name}
                    </button>
                  )}
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>

          <Switch.Group as="div" className="flex justify-between items-center">
            <Switch.Label className="font-semibold text-sm text-slate-700 cursor-pointer">
              Incluir Hostname
            </Switch.Label>
            <Switch
              checked={showHostname}
              onChange={setShowHostname}
              className={`${
                showHostname ? "bg-teal-600" : "bg-gray-200"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
            >
              <span
                className={`${
                  showHostname ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </Switch.Group>

          <RadioGroup
            value={hostnamePosition}
            onChange={setHostnamePosition}
            disabled={!showHostname}
            className="flex justify-between items-center w-full"
          >
            <RadioGroup.Label className="font-semibold text-sm text-slate-600 data-[disabled]:opacity-40">
              Posição:
            </RadioGroup.Label>
            <div className="flex items-center space-x-2">
              {positionOptions.map((option) => (
                <RadioGroup.Option
                  key={option.name}
                  value={option.value}
                  as={Fragment}
                >
                  {({ checked, disabled }) => (
                    <button
                      className={`flex items-center px-3 py-1 text-sm rounded-full transition-colors ${
                        disabled
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : checked
                          ? "bg-teal-600 text-white ring-2 ring-offset-2 ring-teal-600"
                          : "bg-white hover:bg-slate-200"
                      }`}
                    >
                      <option.icon size={14} className="mr-1.5" />
                      {option.name}
                    </button>
                  )}
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>

          <Switch.Group as="div" className="flex justify-between items-center">
            <Switch.Label className="font-semibold text-sm text-slate-700 cursor-pointer">
              Fundo Transparente
            </Switch.Label>
            <Switch
              checked={transparentBg}
              onChange={setTransparentBg}
              className={`${
                transparentBg ? "bg-teal-600" : "bg-gray-200"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
            >
              <span
                className={`${
                  transparentBg ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </Switch.Group>
        </div>

        <div
          id="printable-area"
          className="flex flex-row flex-wrap justify-center items-start gap-4 p-4 max-h-[50vh] overflow-y-auto border rounded-lg"
        >
          {hostnames.map((name) => (
            <div
              key={name}
              className={`inline-flex items-center justify-center p-2 border rounded-md break-inside-avoid bg-white ${
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
                  bgColor={transparentBg ? "transparent" : "#FFFFFF"}
                  fgColor={"#000000"}
                />
              </div>
              {showHostname && (
                <p
                  className="font-mono text-center text-black"
                  style={{ fontSize: "10px" }}
                >
                  {name}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="no-print flex justify-end space-x-3 pt-4">
          <AppButton
            onClick={onClose}
            className="!bg-slate-500 !text-white hover:!bg-slate-600 data-[disabled]:!bg-slate-400"
          >
            <X size={20} className="mr-2" />
            Fechar
          </AppButton>
          <AppButton
            onClick={handleDownload}
            disabled={isDownloading}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 data-[disabled]:!bg-blue-400"
          >
            <Download size={20} className="mr-2" />
            Baixar PNGs
          </AppButton>
          <AppButton onClick={handlePrint} variant="primary">
            <Printer size={20} className="mr-2" />
            Imprimir
          </AppButton>
        </div>
      </div>
    </Modal>
  );
}
