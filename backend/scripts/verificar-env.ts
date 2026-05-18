/**
 * Script para verificar y ayudar a configurar .env
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');

if (!existsSync(envPath)) {
  console.error('Archivo .env no encontrado');
  console.log('\nCrea el archivo .env con:');
  console.log('   cp .env.example .env');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

if (!dbUrlMatch) {
  console.error('DATABASE_URL no encontrado en .env');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1];
console.log('Verificando configuracion de DATABASE_URL...\n');

const hasPlaceholders =
  dbUrl.includes('[YOUR-PASSWORD]') ||
  dbUrl.includes('[YOUR-PROJECT-REF]') ||
  dbUrl.includes('xxxxx');

if (hasPlaceholders) {
  console.log('El DATABASE_URL todavia tiene placeholders:\n');
  console.log(`   ${dbUrl}\n`);
  console.log('Necesitas reemplazar:');
  if (dbUrl.includes('[YOUR-PASSWORD]') || dbUrl.includes('YOUR-PASSWORD')) {
    console.log('   - [YOUR-PASSWORD] -> Tu contrasena real de Supabase');
  }
  if (dbUrl.includes('[YOUR-PROJECT-REF]') || dbUrl.includes('xxxxx')) {
    console.log('   - [YOUR-PROJECT-REF] o xxxxx -> Tu project reference');
  }
  console.log('\nFormato correcto:');
  console.log(
    '   DATABASE_URL="postgresql://postgres:TU_CONTRASENA@db.TU_REF.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"'
  );
  console.log('\nEjemplo:');
  console.log(
    '   DATABASE_URL="postgresql://postgres:MiPass123@db.abcdefghijk.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"'
  );
  process.exit(1);
}

if (!dbUrl.includes('supabase.co')) {
  console.log('El DATABASE_URL no parece ser de Supabase');
  console.log(`   ${dbUrl.substring(0, 50)}...`);
}

if (!dbUrl.includes('?pgbouncer=true')) {
  console.log('Falta el parametro ?pgbouncer=true&connection_limit=1');
  console.log('   Agregalo al final de tu connection string');
}

const hasPostgres = dbUrl.includes('postgresql://postgres:');
const hasDb = dbUrl.includes('@db.');
const hasSupabase = dbUrl.includes('.supabase.co');
const hasPort = dbUrl.includes(':5432');

if (hasPostgres && hasDb && hasSupabase && hasPort) {
  console.log('Formato de DATABASE_URL parece correcto\n');
  console.log('Intentando conectar...');
  console.log('   (Ejecuta: npm run db:test para probar la conexion)');
} else {
  console.log('El formato puede tener problemas:');
  if (!hasPostgres) console.log('   - Falta: postgresql://postgres:');
  if (!hasDb) console.log('   - Falta: @db.');
  if (!hasSupabase) console.log('   - Falta: .supabase.co');
  if (!hasPort) console.log('   - Falta: :5432');
}
