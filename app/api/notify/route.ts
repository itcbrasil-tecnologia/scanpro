import { NextResponse } from "next/server";

// Interface para garantir que o corpo da requisição tenha os dados esperados
interface ConferenceSummary {
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
}

export async function POST(request: Request) {
  // Pega as chaves de forma segura das variáveis de ambiente
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error(
      "As variáveis de ambiente do Telegram não estão configuradas."
    );
    return NextResponse.json(
      { message: "Configuração do servidor incompleta." },
      { status: 500 }
    );
  }

  try {
    const body: ConferenceSummary = await request.json();

    // --- Formatação da Mensagem para o Telegram ---
    // Usamos a sintaxe MarkdownV2 do Telegram para formatar o texto.
    // Caracteres especiais como '.', '-', '(', ')' precisam ser escapados com '\'.
    const escapeMarkdown = (text: string) =>
      text.replace(
        /([._*\[\]()~`>#+\-=|{ LÓGICA DO FIREBASE ADMIN SDK}!])/g,
        "\\$1"
      );

    let messageText =
      `*Resumo da Conferência*\n\n` +
      `*Técnico:* \`${escapeMarkdown(body.userName || "N/A")}\`\n` +
      `*Projeto:* \`${escapeMarkdown(body.projectName)}\`\n` +
      `*UM:* \`${escapeMarkdown(body.umName || "N/A")}\`\n` +
      `*Data:* ${escapeMarkdown(body.date)} das ${escapeMarkdown(
        body.startTime || ""
      )} às ${escapeMarkdown(body.endTime)}\n\n` +
      `*Esperados:* ${body.expectedCount}\n` +
      `*Escaneados:* ${body.scannedCount}\n` +
      `*Faltantes:* ${body.missingCount}\n\n`;

    if (body.missingCount > 0) {
      messageText +=
        `*Dispositivos Não Escaneados:*\n` +
        "```\n" +
        body.missingDevices.join("\n") +
        "\n```";
    } else {
      messageText += `✅ Nenhum dispositivo faltante\\!`;
    }

    // --- Envio para a API do Telegram ---
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "MarkdownV2",
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      // Se o Telegram retornar um erro, nós o registramos para depuração
      console.error("Erro da API do Telegram:", result);
      throw new Error("Não foi possível enviar a mensagem para o Telegram.");
    }

    return NextResponse.json(
      { message: "Notificação enviada com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Notify: Erro ao processar notificação:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro interno do servidor.";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
