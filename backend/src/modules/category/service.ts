import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { createCategorySchema, updateCategorySchema } from './dto';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const createCategory = async (data: z.infer<typeof createCategorySchema>) => {
  const existing = await prisma.category.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new Error('CONFLICT');
  }

  return await prisma.category.create({ data });
};

export const getCategories = async () => {
  return await prisma.category.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateCategory = async (id: string, data: z.infer<typeof updateCategorySchema>) => {
  if (data.name) {
    const existing = await prisma.category.findUnique({ where: { name: data.name } });
    if (existing && existing.id !== id) {
      throw new Error('CONFLICT');
    }
  }

  return await prisma.category.update({
    where: { id },
    data
  });
};

export const deleteCategory = async (id: string) => {
  const transactionsCount = await prisma.transaction.count({ where: { categoryId: id } });

  if (transactionsCount > 0) {
    return await prisma.category.update({
      where: { id },
      data: { isArchived: true }
    });
  } else {
    return await prisma.category.delete({
      where: { id }
    });
  }
};
