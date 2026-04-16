/**
 * middleware.ts  —  Boutique Hotels
 *
 * Responsabilities:
 *  1. Verify JWT access token (ES256) on every protected route.
 *  2. Redirect unauthenticated users to /auth/login.
 *  3. Enforce RBAC: block GUEST users from /admin/* paths.
 *  4. Inject decoded claims into request headers for downstream use.
 *  5. Handle token refresh via HttpOnly cookie.
 *
 * Runs on the Next.js Edge Runtime (no Node.js APIs).
 */

import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify, importSPKI, type JWTPayload } from "jose";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "GUEST" | "HOTEL_ADMIN" | "SUPER_ADMIN";

export interface BoutiqueJWTPayload extends JWTPayload {
  sub: string;          // user UUID
  email: string;
  role: UserRole;
  locale: string;
  sessionId: string;    // Redis session key for revocation checks
}

// ─── Route configuration ──────────────────────────────────────────────────────

/** Routes that are always public — no JWT required */
const PUBLIC_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/auth\/.*/,
  /^\/hotels(\/[^/]+)?$/,      // hotel list & detail are public
  /^\/api\/auth\/.*/,          // NextAuth endpoints
  /^\/api\/health$/,
  /^\/_next\/.*/,
  /^\/favicon\.ico$/,
  /^\/images\/.*/,
];

/** Routes restricted to HOTEL_ADMIN or SUPER_ADMIN */
const ADMIN_ONLY_ROUTES: RegExp[] = [
  /^\/admin\/.*/,
  /^\/api\/admin\/.*/,
];

// ─── JWT verification ─────────────────────────────────────────────────────────

let cachedPublicKey: CryptoKey | null = null;

async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;

  const pem = process.env.JWT_PUBLIC_KEY;
  if (!pem) throw new Error("JWT_PUBLIC_KEY environment variable is not set");

  cachedPublicKey = await importSPKI(pem, "ES256");
  return cachedPublicKey;
}

async function verifyAccessToken(token: string): Promise<BoutiqueJWTPayload> {
  const publicKey = await getPublicKey();

  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ["ES256"],
    issuer: "boutique-hotels",
    audience: "boutique-hotels-client",
  });

  return payload as BoutiqueJWTPayload;
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function extractTokenFromRequest(request: NextRequest): string | undefined {
  // 1. Try HttpOnly cookie (preferred — XSS-safe)
  const cookieToken = request.cookies.get("bh_access_token")?.value;
  if (cookieToken) return cookieToken;

  // 2. Fallback: Authorization header (for API clients)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return undefined;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Step 1: allow public routes without any token check
  if (PUBLIC_ROUTES.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // ── Step 2: extract and verify JWT
  const token = extractTokenFromRequest(request);

  if (!token) {
    return redirectToLogin(request);
  }

  let claims: BoutiqueJWTPayload;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    // Token expired or invalid — clear cookie and redirect
    const response = redirectToLogin(request);
    response.cookies.delete("bh_access_token");
    response.cookies.delete("bh_refresh_token");
    return response;
  }

  // ── Step 3: RBAC — admin routes
  if (ADMIN_ONLY_ROUTES.some((pattern) => pattern.test(pathname))) {
    if (claims.role === "GUEST") {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  }

  // ── Step 4: inject verified claims as request headers
  //    Downstream Server Components/Route Handlers read these without
  //    needing to re-verify the token.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", claims.sub);
  requestHeaders.set("x-user-role", claims.role);
  requestHeaders.set("x-user-email", claims.email);
  requestHeaders.set("x-user-locale", claims.locale);
  requestHeaders.set("x-session-id", claims.sessionId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  /**
   * Apply middleware to every route EXCEPT:
   *  - Next.js internals (_next/static, _next/image)
   *  - Static files (favicon, robots.txt, etc.)
   *
   * The middleware itself handles the public/private distinction.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};