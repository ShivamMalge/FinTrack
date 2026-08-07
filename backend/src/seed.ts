import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('Seeding database...');

  // Seed admin user
  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  if (!adminExists) {
    const hash = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: { email: 'admin@example.com', name: 'Admin User', passwordHash: hash, role: 'ADMIN' }
    });
    console.log('Created admin@example.com (ADMIN)');
  } else {
    console.log('admin@example.com already exists, skipping.');
  }

  // Seed regular user
  const userExists = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
  if (!userExists) {
    const hash = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: { email: 'user@example.com', name: 'Regular User', passwordHash: hash, role: 'USER' }
    });
    console.log('Created user@example.com (USER)');
  } else {
    console.log('user@example.com already exists, skipping.');
  }

  // Seed default categories
  const defaultCategories = [
    { name: 'Salary', type: 'INCOME' as const },
    { name: 'Freelance', type: 'INCOME' as const },
    { name: 'Investments', type: 'INCOME' as const },
    { name: 'Food & Dining', type: 'EXPENSE' as const },
    { name: 'Transportation', type: 'EXPENSE' as const },
    { name: 'Utilities', type: 'EXPENSE' as const },
    { name: 'Entertainment', type: 'EXPENSE' as const },
    { name: 'Shopping', type: 'EXPENSE' as const },
  ];

  for (const cat of defaultCategories) {
    const exists = await prisma.category.findUnique({ where: { name: cat.name } });
    if (!exists) {
      await prisma.category.create({ data: cat });
      console.log(`Created category: ${cat.name} (${cat.type})`);
    }
  }

  console.log('Seeding complete.');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
