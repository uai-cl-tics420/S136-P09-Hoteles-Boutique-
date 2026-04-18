import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
// 1. Añadimos la importación de tu esquema
import * as schema from './schema/index'; 

if (typeof process !== 'undefined' && process.release?.name === 'node') {
  dotenv.config();
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const queryClient = postgres(connectionString);

// 2. Le inyectamos el esquema a la instancia de Drizzle
export const db = drizzle(queryClient, { schema });