import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("firebaseIdToken");
  const { pathname } = request.nextUrl;

  // Se o utilizador não estiver autenticado (sem token) e tentar aceder a uma página protegida,
  // redireciona para a página de login.
  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Se o utilizador estiver autenticado (com token) e tentar aceder à página de login,
  // redireciona para a página inicial do técnico (que por sua vez redirecionará para o dashboard se for admin).
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - api (rotas de API)
     * - _next/static (ficheiros estáticos)
     * - _next/image (pedidos de otimização de imagem)
     * - favicon.ico (ficheiro de favicon)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
