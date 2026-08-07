import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { createTransactionSchema, updateTransactionSchema, queryTransactionSchema } from './dto';
import { Decimal } from 'decimal.js';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const createTransaction = async (userId: string, data: z.infer<typeof createTransactionSchema>) => {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  
  if (!category) {
    throw new Error('CATEGORY_NOT_FOUND');
  }
  if (category.isArchived) {
    throw new Error('CATEGORY_ARCHIVED');
  }
  if (category.type !== data.type) {
    throw new Error('TYPE_MISMATCH');
  }

  return await prisma.transaction.create({
    data: {
      amount: new Decimal(data.amount),
      type: data.type,
      date: new Date(data.date),
      note: data.note,
      categoryId: data.categoryId,
      userId
    },
    include: { category: true }
  });
};

export const getTransactions = async (userId: string, query: z.infer<typeof queryTransactionSchema>) => {
  const where: any = { userId };

  if (query.startDate) where.date = { ...where.date, gte: new Date(query.startDate) };
  if (query.endDate) where.date = { ...where.date, lte: new Date(query.endDate) };
  if (query.type) where.type = query.type;
  if (query.categoryId) where.categoryId = query.categoryId;

  const limit = query.limit ? parseInt(query.limit, 10) : 50;
  const offset = query.offset ? parseInt(query.offset, 10) : 0;

  return await prisma.transaction.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: { date: 'desc' },
    include: { category: true }
  });
};

export const getTransactionsForExport = async (userId: string, query: z.infer<typeof queryTransactionSchema>) => {
  const where: any = { userId };

  if (query.startDate) where.date = { ...where.date, gte: new Date(query.startDate) };
  if (query.endDate) where.date = { ...where.date, lte: new Date(query.endDate) };
  if (query.type) where.type = query.type;
  if (query.categoryId) where.categoryId = query.categoryId;

  return await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { category: true }
  });
};

export const getTransactionById = async (userId: string, transactionId: string) => {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { category: true }
  });

  if (!tx || tx.userId !== userId) {
    return null; // Implicit IDOR protection
  }

  return tx;
};

export const updateTransaction = async (userId: string, transactionId: string, data: z.infer<typeof updateTransactionSchema>) => {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  
  if (!tx || tx.userId !== userId) {
    throw new Error('NOT_FOUND');
  }

  // If changing category, validate it
  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new Error('CATEGORY_NOT_FOUND');
    if (category.isArchived) throw new Error('CATEGORY_ARCHIVED');
    const intendedType = data.type || tx.type;
    if (category.type !== intendedType) throw new Error('TYPE_MISMATCH');
  } else if (data.type && data.type !== tx.type) {
    // If changing type but NOT category, validate existing category matches new type
    const category = await prisma.category.findUnique({ where: { id: tx.categoryId } });
    if (category?.type !== data.type) throw new Error('TYPE_MISMATCH');
  }

  const updateData: any = { ...data };
  if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
  if (data.date !== undefined) updateData.date = new Date(data.date);

  return await prisma.transaction.update({
    where: { id: transactionId },
    data: updateData,
    include: { category: true }
  });
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  
  if (!tx || tx.userId !== userId) {
    throw new Error('NOT_FOUND');
  }

  return await prisma.transaction.delete({
    where: { id: transactionId }
  });
};
