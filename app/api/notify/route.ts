import { NextResponse } from "next/server";

interface SummaryData {
  userName?: string;
  projectName: string;
  umName?: string;
  date: string;
  startTime?: string;
  endTime: string;
  expectedCount: number;
  scannedCount: number;
  missingCount: number;
  missingDevices: string[];
  maintenanceDevices?: string[];
  maintenanceCount?: number;
  miceCount?: number;
  chargersCount?: number;
  headsetsCount?: number;
  latitude?: number;
  longitude?: number;
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error(
      "[ERRO FATAL] Variáveis de ambiente do Telegram não configuradas."
    );
    return NextResponse.json(
      { message: "Erro de configuração no servidor." },
      { status: 500 }
    );
  }

  try {
    const summary: SummaryData = await request.json();

    let message = `*Resumo da Conferência - ScanPRO*\n\n`;
    message += `*Técnico:* ${summary.userName || "N/A"}\n`;
    message += `*Projeto:* ${summary.projectName}\n`;
    message += `*UM:* ${summary.umName || "N/A"}\n`;
    message += `*Data:* ${summary.date}\n`;
    message += `*Horário:* ${summary.startTime} às ${summary.endTime}\n`;

    // Adiciona o link de geolocalização se existir
    if (summary.latitude && summary.longitude) {
      const mapUrl = `https://maps.google.com/?q=${summary.latitude},${summary.longitude}`;
      message += `*Localização:* [Ver no Mapa](${mapUrl})\n`;
    }

    message += `------------------------------------\n\n`;

    const hasPeripherals =
      summary.miceCount !== undefined ||
      summary.chargersCount !== undefined ||
      summary.headsetsCount !== undefined;

    if (hasPeripherals) {
      message += `*Periféricos:*\n`;
      if (summary.miceCount !== undefined)
        message += `- Mouses: *${summary.miceCount}*\n`;
      if (summary.chargersCount !== undefined)
        message += `- Carregadores: *${summary.chargersCount}*\n`;
      if (summary.headsetsCount !== undefined)
        message += `- Fones: *${summary.headsetsCount}*\n`;
      message += `\n------------------------------------\n\n`;
    }

    message += `*Dispositivos Ativos (Esperados):* ${summary.expectedCount}\n`;
    message += `*Dispositivos Escaneados:* ${summary.scannedCount}\n`;
    message += `*Dispositivos Faltantes:* ${summary.missingCount}\n`;
    if (summary.maintenanceCount && summary.maintenanceCount > 0) {
      message += `*Dispositivos em Manutenção:* ${summary.maintenanceCount}\n\n`;
    } else {
      message += `\n`;
    }
    if (summary.missingCount > 0) {
      message += `*Lista de Faltantes:*\n`;
      summary.missingDevices.forEach((device) => {
        message += `- \`${device}\`\n`;
      });
      message += `\n`;
    }
    if (
      summary.maintenanceCount &&
      summary.maintenanceCount > 0 &&
      summary.maintenanceDevices
    ) {
      message += `*Lista em Manutenção:*\n`;
      summary.maintenanceDevices.forEach((device) => {
        message += `- \`${device}\`\n`;
      });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error(
        "[ERRO TELEGRAM] A API do Telegram retornou um erro:",
        result
      );
      throw new Error(
        `Falha ao enviar mensagem para o Telegram: ${result.description}`
      );
    }

    return NextResponse.json({ message: "Notificação enviada com sucesso." });
  } catch (error) {
    console.error("--- [API /api/notify] Erro no bloco catch ---", error);
    return NextResponse.json(
      { message: "Erro ao processar a notificação." },
      { status: 500 }
    );
  }
}
