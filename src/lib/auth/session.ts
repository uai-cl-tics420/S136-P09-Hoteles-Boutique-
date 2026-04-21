import { redis } from "@/lib/redis/client";
import { randomBytes } from "crypto";

const SESSION_TTL = 7 * 24 * 60 * 60;

type SessionData = {
  userId: string;
  role: string;
  createdAt: number;
  otpVerified?: boolean;
};

export async function createSession(userId: string, role: string): Promise<string> {
  const sessionId = randomBytes(32).toString("hex");
  await redis.set(
    `session:${sessionId}`,
    JSON.stringify({ userId, role, createdAt: Date.now() }),
    "EX",
    SESSION_TTL
  );
  return sessionId;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const data = await redis.get(`session:${sessionId}`);
  if (!data) return null;
  return JSON.parse(data) as SessionData;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`);
}

export async function markOtpVerified(sessionId: string): Promise<void> {
  const data = await getSession(sessionId);
  if (!data) return;
  await redis.set(
    `session:${sessionId}`,
    JSON.stringify({ ...data, otpVerified: true }),
    "EX",
    SESSION_TTL
  );
}

export async function isOtpVerified(sessionId: string): Promise<boolean> {
  const data = await getSession(sessionId);
  return data?.otpVerified === true;
}
