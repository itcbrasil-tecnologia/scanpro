import { NextResponse } from "next/server";
import { ConferenceData } from "@/types";
import { Timestamp } from "firebase-admin/firestore";

interface JsonTimestamp {
  seconds: number;
  nanoseconds: number;
}

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error(
      "[ERRO FATAL] Variáveis de ambiente do Telegram não configuradas.",
    );
    return NextResponse.json(
      { message: "Erro de configuração no servidor." },
      { status: 500 },
    );
  }

  try {
    const summary: ConferenceData = await request.json();

    const startTimeJson = summary.startTime as unknown as JsonTimestamp;
    const endTimeJson = summary.endTime as unknown as JsonTimestamp;

    const startTimeDate = new Timestamp(
      startTimeJson.seconds,
      startTimeJson.nanoseconds,
    ).toDate();
    const endTimeDate = new Timestamp(
      endTimeJson.seconds,
      endTimeJson.nanoseconds,
    ).toDate();

    // CORREÇÃO DO FUSO HORÁRIO: Forçando o horário de Brasília (UTC-3)
    const formattedDate = endTimeDate.toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
    const formattedStartTime = startTimeDate.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedEndTime = endTimeDate.toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });

    let message = `*✅ Resumo da Conferência - ScanPRO*\n\n`;
    message += `👤 *Técnico:* ${summary.userName || "N/A"}\n`;
    message += `📂 *Projeto:* ${summary.projectName}\n`;
    message += `🚚 *UM:* ${summary.umName || "N/A"}\n`;
    message += `📅 *Data:* ${formattedDate}\n`;
    message += `🕒 *Horário:* ${formattedStartTime} às ${formattedEndTime}\n`;

    if (summary.latitude && summary.longitude) {
      const mapUrl = `https://www.google.com/maps?q=${summary.latitude},${summary.longitude}`;
      message += `📍 *Localização:* [Ver no Mapa](${mapUrl})\n`;
    }

    message += `\n------------------------------------\n\n`;
    const hasPeripherals =
      summary.miceCount !== undefined ||
      summary.chargersCount !== undefined ||
      summary.headsetsCount !== undefined;
    if (hasPeripherals) {
      message += `*️ Periféricos:*\n`;
      if (summary.miceCount !== undefined)
        message += `- Mouses: *${summary.miceCount}*\n`;
      if (summary.chargersCount !== undefined)
        message += `- Carregadores: *${summary.chargersCount}*\n`;
      if (summary.headsetsCount !== undefined)
        message += `- Fones: *${summary.headsetsCount}*\n`;
      message += `\n------------------------------------\n\n`;
    }

    message += `*💻 Dispositivos Ativos (Esperados):* ${summary.expectedCount}\n`;
    message += `*👍 Dispositivos Escaneados:* ${summary.scannedCount}\n`;
    const missingEmoji = summary.missingCount > 0 ? "❗️" : "👍";
    message += `${missingEmoji} *Dispositivos Faltantes:* ${summary.missingCount}\n`;
    if (summary.maintenanceCount && summary.maintenanceCount > 0) {
      message += `*🔧 Dispositivos em Manutenção:* ${summary.maintenanceCount}\n\n`;
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
        result,
      );
      throw new Error(
        `Falha ao enviar mensagem para o Telegram: ${result.description}`,
      );
    }

    return NextResponse.json({ message: "Notificação enviada com sucesso." });
  } catch (error) {
    console.error("--- [API /api/notify] Erro no bloco catch ---", error);
    return NextResponse.json(
      { message: "Erro ao processar a notificação." },
      { status: 500 },
    );
  }
}
