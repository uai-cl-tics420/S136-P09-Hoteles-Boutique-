import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set");
}

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,  // no conecta hasta el primer comando — no bloquea el arranque
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});
