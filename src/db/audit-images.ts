import { db } from "./index";
import { sql } from "drizzle-orm";
import { config } from "dotenv";
config({ path: ".env" });

async function audit() {
  const [noImg] = await db.execute(sql`SELECT COUNT(*) as c FROM hotels h WHERE NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id)`);
  const [goog]  = await db.execute(sql`SELECT COUNT(*) as c FROM hotel_images WHERE url LIKE '%googleapis%'`);
  const [total] = await db.execute(sql`SELECT COUNT(*) as c FROM hotel_images`);
  console.log("Hotels sin imagen:", noImg.c);
  console.log("URLs Google Places (expiran):", goog.c);
  console.log("Total imágenes en BD:", total.c);
  process.exit(0);
}
audit().catch(e => { console.error(e); process.exit(1); });
