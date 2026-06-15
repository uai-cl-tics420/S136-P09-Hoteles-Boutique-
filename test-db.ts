import { db } from "./src/db/index";
import { hotels } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    const res = await db.select().from(hotels).where(eq(hotels.active, true)).limit(12);
    console.log("Success:", res.length);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

main();
