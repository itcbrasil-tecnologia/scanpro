// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Tenta obter o cookie de autenticação (o Firebase SDK o define automaticamente)
  const isAuthenticated = request.cookies.has("__session"); // Exemplo de nome de cookie

  // Rotas que devem ser acessíveis apenas para usuários NÃO autenticados
  const unauthenticatedRoutes = ["/"]; // Nossa página de login

  // Rotas que devem ser acessíveis apenas para usuários AUTENTICADOS
  const authenticatedRoutes = [
    "/dashboard",
    "/relatorios",
    "/projetos",
    "/ums",
    "/notebooks",
    "/usuarios",
    "/inicio",
    "/scanner",
  ];

  if (
    !isAuthenticated &&
    authenticatedRoutes.some((route) => pathname.startsWith(route))
  ) {
    // Se não está autenticado e tenta acessar uma rota protegida, redireciona para o login
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthenticated && unauthenticatedRoutes.includes(pathname)) {
    // Se está autenticado e tenta acessar a página de login, redireciona para a página inicial do técnico
    // O AuthContext no lado do cliente cuidará do redirecionamento fino (ex: admin -> /dashboard)
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  return NextResponse.next();
}

// Configuração do matcher para definir em quais rotas o middleware será executado
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
