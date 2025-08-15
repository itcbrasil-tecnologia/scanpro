import { NextResponse } from "next/server";
import admin from "@/lib/firebase/admin";

// Duração da sessão (ex: 7 dias)
const expiresIn = 60 * 60 * 24 * 7 * 1000;

// POST: Cria a sessão do usuário
export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json(
        { message: "ID token não fornecido." },
        { status: 400 }
      );
    }

    const decodedIdToken = await admin.auth().verifyIdToken(idToken);

    console.log(`[API Auth] Sessão criada para o UID: ${decodedIdToken.uid}`);

    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    const options = {
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // 1. Cria a resposta primeiro
    const response = NextResponse.json({ status: "success" }, { status: 200 });

    // 2. Define o cookie no objeto de resposta
    response.cookies.set(options);

    // 3. Retorna a resposta com o cookie definido
    return response;
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return NextResponse.json(
      { message: "Autenticação falhou." },
      { status: 401 }
    );
  }
}

// DELETE: Destrói a sessão do usuário (logout)
export async function DELETE() {
  try {
    // 1. Cria a resposta primeiro
    const response = NextResponse.json({ status: "success" }, { status: 200 });

    // 2. Deleta o cookie no objeto de resposta
    response.cookies.delete("session");

    // 3. Retorna a resposta com o cookie removido
    return response;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return NextResponse.json({ message: "Logout falhou." }, { status: 500 });
  }
}
