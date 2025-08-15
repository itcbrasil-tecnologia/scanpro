import { NextResponse } from "next/server";
import admin from "@/lib/firebase/admin";

// Esta rota espera um POST com { uid, subscription }
export async function POST(request: Request) {
  try {
    const { uid, subscription } = await request.json();

    if (!uid || !subscription) {
      return NextResponse.json(
        { message: "UID e Inscrição são obrigatórios." },
        { status: 400 }
      );
    }

    const firestore = admin.firestore();
    const userDocRef = firestore.collection("users").doc(uid);

    // Salva ou atualiza o objeto de inscrição no perfil do usuário
    await userDocRef.update({ pushSubscription: subscription });

    return NextResponse.json(
      { message: "Inscrição salva com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /api/notifications/subscribe]", error);
    return NextResponse.json(
      { message: "Erro ao salvar inscrição." },
      { status: 500 }
    );
  }
}
