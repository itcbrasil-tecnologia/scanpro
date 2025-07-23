import { NextResponse } from "next/server";

// Define a estrutura de dados que esperamos receber no corpo da requisição.
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
}

export async function POST(request: Request) {
  console.log("\n--- [API /api/notify] Nova Requisição Recebida ---");

  // Pega as credenciais das variáveis de ambiente.
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // LOG 1: Verificar se as variáveis de ambiente foram carregadas.
  console.log(`[DIAGNÓSTICO] Bot Token Carregado: ${botToken ? "Sim" : "Não"}`);
  console.log(`[DIAGNÓSTICO] Chat ID Carregado: ${chatId ? "Sim" : "Não"}`);

  if (!botToken || !chatId) {
    console.error(
      "[ERRO FATAL] Variáveis de ambiente do Telegram não configuradas no arquivo .env.local."
    );
    return NextResponse.json(
      { message: "Erro de configuração no servidor." },
      { status: 500 }
    );
  }

  try {
    const summary: SummaryData = await request.json();
    // LOG 2: Verificar o conteúdo recebido do frontend.
    console.log("[DIAGNÓSTICO] Dados do resumo recebidos:", summary);

    // Monta a mensagem de forma legível e organizada.
    let message = `*Resumo da Conferência - ScanPRO*\n\n`;
    message += `*Técnico:* ${summary.userName || "N/A"}\n`;
    message += `*Projeto:* ${summary.projectName}\n`;
    message += `*UM:* ${summary.umName || "N/A"}\n`;
    message += `*Data:* ${summary.date}\n`;
    message += `*Horário:* ${summary.startTime} às ${summary.endTime}\n\n`;
    message += `------------------------------------\n\n`;
    message += `*Dispositivos Esperados:* ${summary.expectedCount}\n`;
    message += `*Dispositivos Escaneados:* ${summary.scannedCount}\n`;
    message += `*Dispositivos Faltantes:* ${summary.missingCount}\n\n`;

    if (summary.missingCount > 0) {
      message += `*Lista de Faltantes:*\n`;
      // Usamos `<code>` para formatar os hostnames de forma monoespaçada, facilitando a leitura.
      summary.missingDevices.forEach((device) => {
        message += `- \`${device}\`\n`;
      });
    }

    // URL da API do Telegram para enviar mensagens.
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    // LOG 3: Mostrar a mensagem que estamos prestes a enviar.
    console.log(
      "[DIAGNÓSTICO] Enviando a seguinte mensagem para o Telegram:",
      message
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown", // Habilita o uso de negrito (*), itálico, etc.
      }),
    });

    const result = await response.json();

    // LOG 4: Mostrar a resposta completa da API do Telegram.
    console.log("[DIAGNÓSTICO] Resposta da API do Telegram:", result);

    if (!result.ok) {
      // Se a resposta não for 'ok', o objeto 'result' conterá o motivo do erro.
      console.error(
        "[ERRO TELEGRAM] A API do Telegram retornou um erro:",
        result
      );
      throw new Error(
        `Falha ao enviar mensagem para o Telegram: ${result.description}`
      );
    }

    console.log("--- [API /api/notify] Notificação enviada com sucesso ---");
    return NextResponse.json({ message: "Notificação enviada com sucesso." });
  } catch (error) {
    console.error("--- [API /api/notify] Erro no bloco catch ---", error);
    return NextResponse.json(
      { message: "Erro ao processar a notificação." },
      { status: 500 }
    );
  }
}
