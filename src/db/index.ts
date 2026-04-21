import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from './schema/index';

if (typeof process !== 'undefined' && process.release?.name === 'node') {
  dotenv.config();
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// FIX: Pool optimizado — prepare:true activa prepared statements (consultas más rápidas),
// max reducido a 5 porque Next.js en standalone ya corre múltiples workers
// y 10 conexiones por worker agota rápido el max_connections de Postgres.
const queryClient = postgres(connectionString, {
  max: 5,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: true, // prepared statements: reduce parse overhead en queries repetidas
});

export const db = drizzle(queryClient, { schema });
