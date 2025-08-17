import { NextResponse } from "next/server";
// A importação 'admin' foi removida daqui
import webpush, { PushSubscription } from "web-push";
import { getFirestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

const db = getFirestore();

webpush.setVapidDetails(
  "mailto:suporte@scanpro.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const { target, payload } = await request.json();

    if (!target || !payload) {
      return NextResponse.json(
        { message: "Alvo e payload são obrigatórios." },
        { status: 400 }
      );
    }

    const subscriptions: PushSubscription[] = [];

    if (target === "all") {
      const usersRef = db.collection("users");
      const techQuery = usersRef.where("role", "==", "USER");
      const techSnapshot = await techQuery.get();

      techSnapshot.forEach((doc: QueryDocumentSnapshot) => {
        if (doc.data().pushSubscription) {
          subscriptions.push(doc.data().pushSubscription);
        }
      });
    } else {
      const userDoc = await db.collection("users").doc(target).get();
      if (userDoc.exists && userDoc.data()?.pushSubscription) {
        subscriptions.push(userDoc.data()?.pushSubscription);
      }
    }

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { message: "Nenhum destinatário válido encontrado para notificar." },
        { status: 404 }
      );
    }

    const sendPromises = subscriptions.map((sub) =>
      webpush.sendNotification(sub, JSON.stringify(payload))
    );

    await Promise.all(sendPromises);

    return NextResponse.json(
      {
        message: `Notificação enviada para ${subscriptions.length} dispositivo(s).`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /api/notifications/dispatch]", error);
    return NextResponse.json(
      { message: "Erro ao despachar notificações." },
      { status: 500 }
    );
  }
}
