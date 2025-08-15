import { NextResponse } from "next/server";
import admin from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { ConferenceData } from "@/types"; // Importa o novo tipo

// Função auxiliar para notificar no Telegram
async function notifyTelegram(summaryData: ConferenceData) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error(
      "[ERRO API] Variáveis de ambiente do Telegram não configuradas."
    );
    return;
  }

  let message = `*Resumo da Conferência - ScanPRO*\n\n`;
  message += `*Técnico:* ${summaryData.userName || "N/A"}\n`;
  message += `*Projeto:* ${summaryData.projectName}\n`;
  message += `*UM:* ${summaryData.umName || "N/A"}\n`;
  message += `*Dispositivos Escaneados:* ${summaryData.scannedCount} de ${summaryData.expectedCount}\n`;
  if (summaryData.missingCount > 0) {
    message += `*Dispositivos Faltantes:* ${summaryData.missingCount}\n`;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error(
      "[ERRO API] Falha ao enviar notificação para o Telegram:",
      error
    );
  }
}

export async function POST(request: Request) {
  try {
    const summaryData: ConferenceData = await request.json();

    if (!summaryData) {
      return NextResponse.json(
        { message: "Dados da conferência ausentes." },
        { status: 400 }
      );
    }

    const firestore = admin.firestore();

    // 1. Salva a conferência no Firestore
    await firestore.collection("conferences").add({
      ...summaryData,
      startTime: Timestamp.fromDate(new Date(summaryData.conferenceStartTime!)),
      endTime: Timestamp.now(),
    });

    // 2. Envia notificação para o Telegram
    await notifyTelegram(summaryData);

    return NextResponse.json(
      { message: "Conferência processada com sucesso." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ERRO API /api/conferences]", error);
    return NextResponse.json(
      { message: "Erro interno ao processar a conferência." },
      { status: 500 }
    );
  }
}
