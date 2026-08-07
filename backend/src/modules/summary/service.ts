import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Decimal } from 'decimal.js';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const getSummary = async (userId: string, from?: string, to?: string) => {
  const where: any = { userId };
  if (from) where.date = { ...where.date, gte: new Date(from) };
  if (to) where.date = { ...where.date, lte: new Date(to) };

  const txs = await prisma.transaction.findMany({
    where,
    include: { category: true }
  });

  let totalIncome = new Decimal(0);
  let totalExpense = new Decimal(0);
  const byCategoryMap = new Map<string, { categoryId: string, name: string, total: Decimal }>();

  for (const tx of txs) {
    if (tx.type === 'INCOME') {
      totalIncome = totalIncome.plus(tx.amount);
    } else {
      totalExpense = totalExpense.plus(tx.amount);
    }

    if (!byCategoryMap.has(tx.categoryId)) {
      byCategoryMap.set(tx.categoryId, {
        categoryId: tx.categoryId,
        name: tx.category.name,
        total: new Decimal(0)
      });
    }
    const cat = byCategoryMap.get(tx.categoryId)!;
    cat.total = cat.total.plus(tx.amount);
  }

  return {
    totalIncome: totalIncome.toNumber(),
    totalExpense: totalExpense.toNumber(),
    balance: totalIncome.minus(totalExpense).toNumber(),
    byCategory: Array.from(byCategoryMap.values()).map(c => ({ ...c, total: c.total.toNumber() }))
  };
};
