import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/routes';
import categoryRoutes from './modules/category/routes';
import transactionRoutes from './modules/transaction/routes';
import summaryRoutes from './modules/summary/routes';
import userRoutes from './modules/user/routes';
import { authenticate, requireRole } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', authenticate, categoryRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);
app.use('/api/summary', authenticate, summaryRoutes);
app.use('/api/users', authenticate, requireRole('ADMIN'), userRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
