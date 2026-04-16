import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const runMigrate = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is missing");

  console.log('⏳ Aplicando migraciones a la base de datos...');
  
  // Usamos max: 1 porque las migraciones solo necesitan una conexión directa
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  // Le decimos a Drizzle que lea la carpeta que generaste
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('✅ ¡Migraciones completadas con éxito!');
  
  // Cerramos la conexión para que el script termine
  await migrationClient.end();
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ La migración falló:', err);
  process.exit(1);
});