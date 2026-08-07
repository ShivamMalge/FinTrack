import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { registerSchema, loginSchema } from './dto';
import { signToken } from '../../utils/jwt';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const registerService = async (data: z.infer<typeof registerSchema>) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error('CONFLICT');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: 'USER' // Roles will be manually promoted for Admin testing
    }
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role };
};

export const loginService = async (data: z.infer<typeof loginSchema>) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('UNAUTHENTICATED');
  }

  const token = signToken({ id: user.id, role: user.role });
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token
  };
};
