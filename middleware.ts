import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("firebaseAuthToken");
  const { pathname } = request.nextUrl;

  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // MATCHER ATUALIZADO: Adicionada uma regra para ignorar arquivos com extensões (ex: .svg, .png)
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*|favicon.ico|icons).*)"],
};
