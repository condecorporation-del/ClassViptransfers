/**
 * Script para verificar y ayudar a configurar .env
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');

if (!existsSync(envPath)) {
  console.error('❌ Archivo .env no encontrado');
  console.log('\n💡 Crea el archivo .env con:');
  console.log('   cp env.example.txt .env');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

if (!dbUrlMatch) {
  console.error('❌ DATABASE_URL no encontrado en .env');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1];
console.log('📋 Verificando configuración de DATABASE_URL...\n');

// Verificar placeholders
const hasPlaceholders = dbUrl.includes('[YOUR-PASSWORD]') || 
                       dbUrl.includes('[YOUR-PROJECT-REF]') ||
                       dbUrl.includes('xxxxx');

if (hasPlaceholders) {
  console.log('⚠️  El DATABASE_URL todavía tiene placeholders:\n');
  console.log(`   ${dbUrl}\n`);
  console.log('❌ Necesitas reemplazar:');
  if (dbUrl.includes('[YOUR-PASSWORD]') || dbUrl.includes('YOUR-PASSWORD')) {
    console.log('   - [YOUR-PASSWORD] → Tu contraseña real de Supabase');
  }
  if (dbUrl.includes('[YOUR-PROJECT-REF]') || dbUrl.includes('xxxxx')) {
    console.log('   - [YOUR-PROJECT-REF] o xxxxx → Tu project reference');
  }
  console.log('\n📝 Formato correcto:');
  console.log('   DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@db.TU_REF.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"');
  console.log('\n💡 Ejemplo:');
  console.log('   DATABASE_URL="postgresql://postgres:MiPass123@db.abcdefghijk.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"');
  process.exit(1);
}

// Verificar formato básico
if (!dbUrl.includes('supabase.co')) {
  console.log('⚠️  El DATABASE_URL no parece ser de Supabase');
  console.log(`   ${dbUrl.substring(0, 50)}...`);
}

if (!dbUrl.includes('?pgbouncer=true')) {
  console.log('⚠️  Falta el parámetro ?pgbouncer=true&connection_limit=1');
  console.log('   Agrégalo al final de tu connection string');
}

// Verificar que tenga los componentes básicos
const hasPostgres = dbUrl.includes('postgresql://postgres:');
const hasDb = dbUrl.includes('@db.');
const hasSupabase = dbUrl.includes('.supabase.co');
const hasPort = dbUrl.includes(':5432');

if (hasPostgres && hasDb && hasSupabase && hasPort) {
  console.log('✅ Formato de DATABASE_URL parece correcto\n');
  console.log('🔌 Intentando conectar...');
  console.log('   (Ejecuta: npm run db:test para probar la conexión)');
} else {
  console.log('⚠️  El formato puede tener problemas:');
  if (!hasPostgres) console.log('   - Falta: postgresql://postgres:');
  if (!hasDb) console.log('   - Falta: @db.');
  if (!hasSupabase) console.log('   - Falta: .supabase.co');
  if (!hasPort) console.log('   - Falta: :5432');
}

