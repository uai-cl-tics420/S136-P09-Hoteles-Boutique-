import { SignJWT, importPKCS8, importSPKI } from "jose";
import { hash as argon2Hash, verify as argon2Verify } from "argon2";
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// Engañamos a Turbopack usando require para otplib
const otplib = require("otplib");
const authenticator = otplib?.authenticator || otplib?.default?.authenticator;

// ─── Tipos (Movidos aquí para independizarlos del middleware) ─────────────────

export type UserRole = "GUEST" | "HOTEL_ADMIN" | "SUPER_ADMIN";

export interface BoutiqueJWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  locale: string;
  sessionId: string;
}

// ─── Configuration ────────────────────────────────────────────────────────────

const JWT_ALGORITHM = "ES256" as const;
const JWT_ISSUER = "boutique-hotels";
const JWT_AUDIENCE = "boutique-hotels-client";

/** Argon2id parameters (OWASP 2023 recommended minimums) */
const ARGON2_OPTIONS = {
  type: 2,          // Argon2id
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 4,
};

// ─── Key loading (cached) ─────────────────────────────────────────────────────

let _privateKey: CryptoKey | null = null;
let _publicKey: CryptoKey | null = null;

async function getPrivateKey(): Promise<CryptoKey> {
  if (_privateKey) return _privateKey;
  const pem = process.env.JWT_PRIVATE_KEY;
  if (!pem) throw new Error("JWT_PRIVATE_KEY is not configured");
  _privateKey = await importPKCS8(pem, JWT_ALGORITHM);
  return _privateKey;
}

async function getPublicKey(): Promise<CryptoKey> {
  if (_publicKey) return _publicKey;
  const pem = process.env.JWT_PUBLIC_KEY;
  if (!pem) throw new Error("JWT_PUBLIC_KEY is not configured");
  _publicKey = await importSPKI(pem, JWT_ALGORITHM);
  return _publicKey;
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export async function signAccessToken(
  payload: Omit<BoutiqueJWTPayload, "iss" | "aud" | "iat" | "exp">
): Promise<string> {
  const privateKey = await getPrivateKey();

  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(process.env.JWT_EXPIRY ?? "15m")
    .sign(privateKey);
}

/** Opaque refresh token: 32 random bytes → base64url */
export function generateRefreshToken(): { raw: string; hashed: string } {
  const raw = randomBytes(32).toString("base64url");
  // Store only SHA-256 hash in Redis — raw token is sent to client
  const hashed = createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
}

// ─── Password hashing (Argon2id) ─────────────────────────────────────────────

export async function hashPassword(plaintext: string): Promise<string> {
  const hash = await argon2Hash(plaintext, ARGON2_OPTIONS as any);
  return hash.toString();
}

export async function verifyPassword(
  hash: string,
  plaintext: string
): Promise<boolean> {
  try {
    return await argon2Verify(hash, plaintext);
  } catch {
    return false;
  }
}

// ─── TOTP / OTP ───────────────────────────────────────────────────────────────

/**
 * Configure otplib to match OTP_* env vars.
 * RFC 6238 (TOTP) using HMAC-SHA1, 6 digits, 30-second window.
 */
if (authenticator) {
  authenticator.options = {
    digits: parseInt(process.env.OTP_DIGITS ?? "6", 10),
    step: parseInt(process.env.OTP_PERIOD ?? "30", 10),
    algorithm: "sha1",
    window: 1, // allow 1 step drift (30 s) to account for clock skew
  };
}

/** Generate a new TOTP secret for a user */
export function generateTotpSecret(): string {
  if (!authenticator) throw new Error("OTP library not loaded");
  return authenticator.generateSecret(20); // 160-bit secret (RFC 4226 minimum)
}

/** Build the otpauth:// URI for QR code generation */
export function buildTotpUri(secret: string, email: string): string {
  if (!authenticator) throw new Error("OTP library not loaded");
  return authenticator.keyuri(
    email,
    process.env.OTP_ISSUER ?? "BoutiqueHotels",
    secret
  );
}

/** Verify a 6-digit TOTP token against the stored (decrypted) secret */
export function verifyTotp(token: string, secret: string): boolean {
  if (!authenticator) throw new Error("OTP library not loaded");
  return authenticator.check(token, secret);
}

// ─── OTP secret encryption (AES-256-GCM) ─────────────────────────────────────

const PEPPER = Buffer.from(
  process.env.OTP_PEPPER ?? "CHANGE_ME_IN_ENV_32_BYTES_EXACTLY",
  "utf-8"
).subarray(0, 32); // enforce 256-bit key

/** Encrypt a TOTP secret before storing it in the DB */
export function encryptOtpSecret(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv("aes-256-gcm", PEPPER, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag(); // 128-bit authentication tag

  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`;
}

/** Decrypt a TOTP secret retrieved from the DB */
export function decryptOtpSecret(encoded: string): string {
  const [ivHex, tagHex, ciphertextHex] = encoded.split(".");
  if (!ivHex || !tagHex || !ciphertextHex) {
    throw new Error("Invalid encrypted OTP secret format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", PEPPER, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf-8");
}

// ─── Combined login flow ──────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
  totpToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string; // raw, to be set in HttpOnly cookie
}

export async function issueTokensForUser(user: {
  id: string;
  email: string;
  role: UserRole;
  locale: string;
  sessionId: string;
}): Promise<AuthTokens> {
  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    locale: user.locale,
    sessionId: user.sessionId,
  });

  const { raw: refreshToken } = generateRefreshToken();

  return { accessToken, refreshToken };
}