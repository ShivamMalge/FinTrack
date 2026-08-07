import { Request, Response, NextFunction } from 'express';
import { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction } from './service';
import { successResponse, errorResponse } from '../../utils/apiResponse';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const tx = await createTransaction(userId, req.body);
    res.status(201).json(successResponse(tx));
  } catch (error: any) {
    if (['CATEGORY_NOT_FOUND', 'CATEGORY_ARCHIVED', 'TYPE_MISMATCH'].includes(error.message)) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', error.message));
    } else {
      next(error);
    }
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const txs = await getTransactions(userId, req.query as any);
    res.status(200).json(successResponse(txs));
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const tx = await getTransactionById(userId, req.params.id);
    if (!tx) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Transaction not found'));
    }
    res.status(200).json(successResponse(tx));
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const tx = await updateTransaction(userId, req.params.id, req.body);
    res.status(200).json(successResponse(tx));
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json(errorResponse('NOT_FOUND', 'Transaction not found'));
    } else if (['CATEGORY_NOT_FOUND', 'CATEGORY_ARCHIVED', 'TYPE_MISMATCH'].includes(error.message)) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', error.message));
    } else {
      next(error);
    }
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await deleteTransaction(userId, req.params.id);
    res.status(200).json(successResponse({ success: true }));
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json(errorResponse('NOT_FOUND', 'Transaction not found'));
    } else {
      next(error);
    }
  }
};
