// app/api/users/route.ts
import { NextResponse } from "next/server";
import admin from "@/lib/firebase/admin";

/**
 * Rota para CRIAR um novo usuário REAL no Firebase.
 */
export async function POST(request: Request) {
  try {
    const { email, senha, nome, whatsapp, role } = await request.json();

    // 1. Cria o usuário no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: senha,
      displayName: nome,
    });

    // 2. Salva o perfil customizado no Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      nome: nome,
      email: email,
      whatsapp: whatsapp,
      role: role,
    });

    return NextResponse.json(
      { message: `Usuário ${nome} criado com sucesso.` },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Captura o erro como 'unknown'
    console.error("API Rota: Erro ao criar usuário:", error);

    let message = "Erro ao criar usuário.";

    // CORREÇÃO: Verificação de tipo segura sem usar 'as any'
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === "auth/email-already-exists"
    ) {
      message = "Este e-mail já está em uso.";
    }

    return NextResponse.json({ message }, { status: 400 });
  }
}

/**
 * Rota para DELETAR um usuário REAL no Firebase.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { message: "UID do usuário é obrigatório." },
        { status: 400 }
      );
    }

    // 1. Deleta o usuário do Firebase Authentication
    await admin.auth().deleteUser(uid);

    // 2. Deleta o perfil do Firestore
    await admin.firestore().collection("users").doc(uid).delete();

    return NextResponse.json(
      { message: `Usuário deletado com sucesso.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Rota: Erro ao deletar usuário:", error);
    return NextResponse.json(
      { message: "Erro ao deletar usuário." },
      { status: 500 }
    );
  }
}
