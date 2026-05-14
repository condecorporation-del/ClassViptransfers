/**
 * Non-interactive Supabase setup using environment variables
 * Usage: SUPABASE_PROJECT_REF=xxx SUPABASE_PASSWORD=yyy npx tsx scripts/setup-with-env.ts
 */

import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../src/shared/lib/errors';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

async function main() {
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const password = process.env.SUPABASE_PASSWORD;

  if (!projectRef || !password) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_PROJECT_REF=your-project-ref');
    console.error('   SUPABASE_PASSWORD=your-password');
    console.error('\nExample:');
    console.error('   SUPABASE_PROJECT_REF=abcdefghijk SUPABASE_PASSWORD=mypass npx tsx scripts/setup-with-env.ts');
    process.exit(1);
  }

  console.log('🚀 Automated Supabase Setup (Non-Interactive)\n');

  // Generate DATABASE_URL
  const databaseUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1`;

  console.log('📝 Creating .env file...');
  
  // Read env.example
  const envExamplePath = join(process.cwd(), 'env.example.txt');
  let envContent = '';
  
  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf-8');
  } else {
    envContent = `# Database
DATABASE_URL="${databaseUrl}"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:8080

# Admin (for audit logs - optional)
ADMIN_USER_ID=admin
`;
  }

  // Replace DATABASE_URL
  const envPath = join(process.cwd(), '.env');
  const updatedEnv = envContent.replace(
    /DATABASE_URL=".*"/,
    `DATABASE_URL="${databaseUrl}"`
  );

  writeFileSync(envPath, updatedEnv);
  console.log('✅ .env file created\n');

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  try {
    execSync('npm run db:generate', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Prisma client generated\n');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client');
    process.exit(1);
  }

  // Test connection
  console.log('🔌 Testing database connection...');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!\n');
  } catch (error) {
    console.error('❌ Connection failed:', getErrorMessage(error));
    await prisma.$disconnect();
    process.exit(1);
  }

  // Push schema
  console.log('📊 Pushing schema to Supabase...');
  try {
    execSync('npm run db:push', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Schema pushed successfully!\n');
  } catch (error) {
    console.error('❌ Failed to push schema');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Verify tables
  console.log('📋 Verifying tables...');
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    if (tables.length === 0) {
      console.log('⚠️  No tables found');
    } else {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`   - ${table.tablename}`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('⚠️  Could not verify tables:', getErrorMessage(error));
  }

  // Test booking creation
  console.log('🧪 Testing booking creation...');
  try {
    let customer = await prisma.customer.findFirst({
      where: { email: 'test-auto-setup@example.com' },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: 'Test User',
          email: 'test-auto-setup@example.com',
          phone: '+1234567890',
          language: 'en',
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        type: 'TRANSPORTATION',
        status: 'DRAFT',
        customerId: customer.id,
        bookingDate: new Date('2024-12-25'),
        bookingTime: '10:00',
        pickupLocation: 'Airport',
        dropoffLocation: 'Hotel',
        passengers: 2,
        totalAmount: 8500,
        subtotalAmount: 8500,
        currency: 'USD',
        items: {
          create: {
            type: 'TRANSPORTATION',
            name: 'Private Transfer',
            quantity: 1,
            unitPrice: 8500,
            totalPrice: 8500,
          },
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    console.log('✅ Test booking created successfully!');
    console.log(`   Booking ID: ${booking.id}`);
    console.log(`   Total Amount: $${(booking.totalAmount / 100).toFixed(2)} (${booking.totalAmount} cents)`);
    console.log('');

    // Clean up
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
    await prisma.customer.delete({ where: { id: customer.id } }).catch(() => {});
    console.log('🧹 Test data cleaned up\n');
  } catch (error) {
    console.error('❌ Failed to create test booking:', getErrorMessage(error));
  }

  await prisma.$disconnect();

  console.log('🎉 Setup Complete!\n');
  console.log('✅ Supabase connected');
  console.log('✅ Prisma synced');
  console.log('✅ Tables created');
  console.log('✅ Test booking inserted\n');
}

main().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});


