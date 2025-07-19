// app/api/users/route.ts
import { NextResponse } from "next/server";

// ATENÇÃO: Em um projeto real, esta rota seria protegida e usaria o Firebase Admin SDK
// para criar e deletar usuários com segurança.
// Como estamos simulando o backend, vamos apenas retornar respostas de sucesso.

/**
 * Rota para CRIAR um novo usuário.
 * Recebe os dados do usuário e simula a criação.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // CORREÇÃO: 'email' removido da desestruturação pois não era usado.
    const { nome } = body;

    console.log("API Rota: Tentando criar usuário:", body);

    // LÓGICA DO FIREBASE ADMIN SDK (simulada):
    // 1. Verificar se quem chama é um MASTER.
    // 2. admin.auth().createUser({ email, password });
    // 3. admin.firestore().collection('users').doc(newUser.uid).set({ nome, email, ... });

    return NextResponse.json(
      { message: `Usuário ${nome} criado com sucesso (simulado).` },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Rota: Erro ao criar usuário:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

/**
 * Rota para DELETAR um usuário.
 * Recebe o UID do usuário e simula a exclusão.
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

    console.log("API Rota: Tentando deletar usuário com UID:", uid);

    // LÓGICA DO FIREBASE ADMIN SDK (simulada):
    // 1. Verificar se quem chama é um MASTER.
    // 2. admin.auth().deleteUser(uid);
    // 3. admin.firestore().collection('users').doc(uid).delete();

    return NextResponse.json(
      { message: `Usuário deletado com sucesso (simulado).` },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Rota: Erro ao deletar usuário:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
