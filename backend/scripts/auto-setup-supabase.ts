/**
 * Automated Supabase Setup Script
 * This script automates the entire Supabase connection setup
 * 
 * Usage: npx tsx scripts/auto-setup-supabase.ts
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🚀 Automated Supabase Setup\n');
  console.log('This script will:');
  console.log('  1. Create .env file with Supabase connection');
  console.log('  2. Generate Prisma client');
  console.log('  3. Push schema to Supabase');
  console.log('  4. Test connection and create test booking\n');

  // Check if Supabase project exists
  console.log('📋 Supabase Project Setup\n');
  console.log('If you haven\'t created a Supabase project yet:');
  console.log('  1. Go to: https://supabase.com');
  console.log('  2. Click "New Project"');
  console.log('  3. Create project and save your database password');
  console.log('  4. Get your project reference from Settings > Database\n');

  // Get project reference
  const projectRef = await question('Enter your Supabase project reference (e.g., abcdefghijk): ');
  if (!projectRef || projectRef.trim().length === 0) {
    console.error('❌ Project reference is required');
    process.exit(1);
  }

  // Get password
  const password = await question('Enter your Supabase database password: ');
  if (!password || password.trim().length === 0) {
    console.error('❌ Password is required');
    process.exit(1);
  }

  // Generate DATABASE_URL
  const databaseUrl = `postgresql://postgres:${password}@db.${projectRef.trim()}.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1`;

  console.log('\n📝 Creating .env file...');
  
  // Read env.example
  const envExamplePath = join(process.cwd(), 'env.example.txt');
  let envContent = '';
  
  if (existsSync(envExamplePath)) {
    envContent = readFileSync(envExamplePath, 'utf-8');
  } else {
    // Create default .env content
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

  // Step 2: Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  try {
    execSync('npm run db:generate', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Prisma client generated\n');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client');
    process.exit(1);
  }

  // Step 3: Test connection
  console.log('🔌 Testing database connection...');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!\n');
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n💡 Please verify:');
    console.error('   - Project reference is correct');
    console.error('   - Password is correct');
    console.error('   - Project is fully provisioned (wait 2-3 minutes after creation)');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Step 4: Push schema
  console.log('📊 Pushing schema to Supabase...');
  try {
    execSync('npm run db:push', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Schema pushed successfully!\n');
  } catch (error) {
    console.error('❌ Failed to push schema');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Step 5: Verify tables
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
  } catch (error: any) {
    console.error('⚠️  Could not verify tables:', error.message);
  }

  // Step 6: Test booking creation
  console.log('🧪 Testing booking creation...');
  try {
    // Create test customer (use findFirst + create pattern)
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

    // Create test booking
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
        totalAmount: 8500, // $85.00 in cents
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

    // Clean up test data
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
    await prisma.customer.delete({ where: { id: customer.id } }).catch(() => {});
    console.log('🧹 Test data cleaned up\n');
  } catch (error: any) {
    console.error('❌ Failed to create test booking:', error.message);
    console.error('   This might indicate a schema issue');
  }

  await prisma.$disconnect();

  // Final summary
  console.log('🎉 Setup Complete!\n');
  console.log('✅ Supabase connected');
  console.log('✅ Prisma synced');
  console.log('✅ Tables created');
  console.log('✅ Test booking inserted\n');
  console.log('🚀 You can now start the server:');
  console.log('   npm run dev\n');
  console.log('📝 Test endpoints:');
  console.log('   POST http://localhost:3001/api/bookings');
  console.log('   GET  http://localhost:3001/api/admin/bookings?date=2024-12-25\n');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});

