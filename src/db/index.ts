import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Solo cargamos dotenv si no estamos en el Edge (Next.js inyecta el env automáticamente ahí)
if (typeof process !== 'undefined' && process.release?.name === 'node') {
  dotenv.config();
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Cliente global de Postgres
const queryClient = postgres(connectionString);

// Instancia global de Drizzle ORM
export const db = drizzle(queryClient);