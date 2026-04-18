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

// Configurar pool de conexiones para evitar "too many clients"
const queryClient = postgres(connectionString, {
  max: 10, // Máximo 10 conexiones simultáneas
  idle_timeout: 20,
  connect_timeout: 10,
});

// 2. Le inyectamos el esquema a la instancia de Drizzle
export const db = drizzle(queryClient, { schema });