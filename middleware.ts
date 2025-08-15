import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("session");
  const { pathname } = request.nextUrl;

  // Se não há cookie de sessão e o usuário tenta acessar uma rota protegida
  if (!sessionCookie && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Se há cookie de sessão e o usuário tenta acessar a página de login
  if (sessionCookie && pathname === "/") {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*|favicon.ico|icons).*)"],
};
