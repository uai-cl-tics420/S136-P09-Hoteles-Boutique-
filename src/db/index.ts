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

// FIX: Pool optimizado — prepare:false porque Supabase usa PgBouncer en modo
// transaction, que NO soporta prepared statements del lado del servidor.
// Con prepare:true las lateral-join queries de Drizzle (.query.*) fallan en producción.
const queryClient = postgres(connectionString, {
  max: 5,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false, // REQUIRED: PgBouncer (transaction mode) no soporta prepared statements
});

export const db = drizzle(queryClient, { schema });
