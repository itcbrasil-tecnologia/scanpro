import { NextResponse } from "next/server";
import admin from "@/lib/firebase/admin";
import webpush from "web-push";

// Configura o web-push com as chaves VAPID do nosso ambiente
webpush.setVapidDetails(
  "mailto:scanpro@grupoitcbrasil.com.br", // Um e-mail de contato
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { message: "UID do usuário é obrigatório." },
        { status: 400 }
      );
    }

    const firestore = admin.firestore();
    const userDocRef = firestore.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { message: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const subscription = userDoc.data()?.pushSubscription;

    if (!subscription) {
      return NextResponse.json(
        { message: "Usuário não possui uma inscrição para notificações." },
        { status: 404 }
      );
    }

    // Define o conteúdo da nossa notificação de boas-vindas
    const payload = JSON.stringify({
      title: "Bem-vindo ao ScanPRO!",
      body: "Suas notificações foram ativadas com sucesso.",
      icon: "/icons/icon-512x512.png",
    });

    // Envia a notificação
    await webpush.sendNotification(subscription, payload);

    return NextResponse.json(
      { message: "Notificação de boas-vindas enviada." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /api/notifications/send-welcome]", error);
    return NextResponse.json(
      { message: "Erro ao enviar notificação." },
      { status: 500 }
    );
  }
}
