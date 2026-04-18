import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { NextResponse, type NextRequest } from "next/server";

// 1. Iniciamos Auth.js en el Edge SOLO con la configuración ligera
const { auth } = NextAuth(authConfig);

// ─── Route configuration ──────────────────────────────────────────────────────
const PUBLIC_ROUTES: RegExp[] = [
  /^(?:\/[a-zA-Z]{2})?$/,
  /^(?:\/[a-zA-Z]{2})?\/auth\/.*/,
  /^(?:\/[a-zA-Z]{2})?\/hotels(\/[^/]+)?$/,
  /^\/api\/auth\/.*/,
  /^\/api\/health$/,
  /^\/_next\/.*/,
  /^\/favicon\.ico$/,
  /^\/images\/.*/,
];

const ADMIN_ONLY_ROUTES: RegExp[] = [
  /^(?:\/[a-zA-Z]{2})?\/admin\/.*/,
  /^\/api\/admin\/.*/,
];

// ─── Middleware ───────────────────────────────────────────────────────────────
export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  const session = request.auth;

  if (!session || !session.user) {
    return redirectToLogin(request as NextRequest);
  }

  const claims = session.user;

  if (ADMIN_ONLY_ROUTES.some((pattern) => pattern.test(pathname))) {
    if (claims.role === "GUEST") {
      const localeMatch = request.nextUrl.pathname.match(/^\/([a-zA-Z]{2})\//);
      const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
      return NextResponse.redirect(new URL(`${localePrefix}/403`, request.url));
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", claims.id);
  requestHeaders.set("x-user-role", claims.role);
  requestHeaders.set("x-user-email", claims.email || "");

  return NextResponse.next({ request: { headers: requestHeaders } });
});

function redirectToLogin(request: NextRequest): NextResponse {
  const localeMatch = request.nextUrl.pathname.match(/^\/([a-zA-Z]{2})\//);
  const localePrefix = localeMatch ? `/${localeMatch[1]}` : '/es';
  
  const loginUrl = new URL(`${localePrefix}/auth/login`, request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};