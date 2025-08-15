// app/api/users/route.ts
import { NextResponse } from "next/server";
import admin from "@/lib/firebase/admin";
import { UserRole } from "@/types";

interface UserPayload {
  email: string;
  senha?: string;
  nome: string;
  whatsapp: string;
  role: UserRole;
  uid?: string; // UID é necessário para atualizações
}

/**
 * Rota para CRIAR um novo usuário REAL no Firebase.
 */
export async function POST(request: Request) {
  try {
    const { email, senha, nome, whatsapp, role }: UserPayload =
      await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { message: "Email e Senha são obrigatórios para criar." },
        { status: 400 }
      );
    }

    // 1. Cria o usuário no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: senha,
      displayName: nome,
    });

    // 2. Define o Custom Claim com a role do usuário
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });

    // 3. Salva o perfil customizado no Firestore
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
    console.error("API Rota: Erro ao criar usuário:", error);
    let message = "Erro ao criar usuário.";
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

// Rota PUT para ATUALIZAR um usuário (necessário para atualizar claims)
export async function PUT(request: Request) {
  try {
    const { uid, nome, whatsapp, role }: UserPayload = await request.json();

    if (!uid) {
      return NextResponse.json(
        { message: "UID do usuário é obrigatório para atualizar." },
        { status: 400 }
      );
    }

    // 1. Atualiza o Custom Claim com a nova role
    await admin.auth().setCustomUserClaims(uid, { role: role });

    // 2. Atualiza o perfil no Firestore
    await admin.firestore().collection("users").doc(uid).update({
      nome: nome,
      whatsapp: whatsapp,
      role: role,
    });

    return NextResponse.json(
      { message: `Usuário ${nome} atualizado com sucesso.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Rota: Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { message: "Erro ao atualizar usuário." },
      { status: 500 }
    );
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
    await admin.auth().deleteUser(uid);
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
