import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5433/finance_tracker' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { role: 'ADMIN' }
  });
  console.log('Admin user promoted successfully.');
}
main().catch(console.error).finally(() => process.exit(0));
