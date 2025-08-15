import { NextResponse } from "next/server";
import admin from "@/lib/firebase/admin";
import webpush from "web-push";

// Configura o web-push com as chaves VAPID do nosso ambiente
webpush.setVapidDetails(
  "mailto:seu-email@exemplo.com", // Um e-mail de contato
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    // Esperamos um corpo de requisição com o UID do usuário e o payload da notificação
    const { uid, payload } = await request.json();

    if (!uid || !payload) {
      return NextResponse.json(
        { message: "UID e payload são obrigatórios." },
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

    const userData = userDoc.data();
    const subscription = userData?.pushSubscription;

    if (!subscription) {
      return NextResponse.json(
        { message: "Usuário não está inscrito para receber notificações." },
        { status: 404 }
      );
    }

    // Envia a notificação para a inscrição do usuário
    await webpush.sendNotification(subscription, JSON.stringify(payload));

    return NextResponse.json(
      { message: "Notificação enviada com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /api/notifications/send]", error);
    // Se a inscrição for inválida (ex: usuário limpou dados do navegador), o erro pode ser tratado aqui
    return NextResponse.json(
      { message: "Erro ao enviar notificação." },
      { status: 500 }
    );
  }
}
