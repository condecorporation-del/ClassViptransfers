/**
 * Test database connection script
 * Run with: npx tsx scripts/test-connection.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../src/lib/errors';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log('\n📊 Tables in database:');
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found. Run: npm run db:push');
    } else {
      tables.forEach(table => {
        console.log(`   ✅ ${table.tablename}`);
      });
    }
    
    console.log('\n✅ Database connection test passed!');
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', getErrorMessage(error));
    
    if (getErrorMessage(error).includes('DATABASE_URL')) {
      console.error('\n💡 Make sure DATABASE_URL is set in .env file');
    } else if (getErrorMessage(error).includes('password')) {
      console.error('\n💡 Check your database password in DATABASE_URL');
    } else if (getErrorMessage(error).includes('SSL')) {
      console.error('\n💡 For Supabase, ensure connection string includes SSL parameters');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();


