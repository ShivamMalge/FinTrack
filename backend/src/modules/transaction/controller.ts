import { Request, Response, NextFunction } from 'express';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction, getTransactionsForExport } from './service';
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

export const exportTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const format = req.query.format as string;
    
    if (format !== 'csv' && format !== 'xlsx') {
      return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid format. Must be csv or xlsx'));
    }

    const txs = await getTransactionsForExport(userId, req.query as any);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `transactions-${dateStr}`;

    const data = txs.map(tx => ({
      Date: tx.date.toISOString().split('T')[0],
      Type: tx.type,
      Category: tx.category.name,
      Amount: tx.amount.toNumber(),
      Note: tx.note || ''
    }));

    if (format === 'csv') {
      const parser = new Parser({ fields: ['Date', 'Type', 'Category', 'Amount', 'Note'] });
      const csv = parser.parse(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.status(200).send(csv);
    } else {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Transactions');
      
      sheet.columns = [
        { header: 'Date', key: 'Date', width: 15 },
        { header: 'Type', key: 'Type', width: 10 },
        { header: 'Category', key: 'Category', width: 20 },
        { header: 'Amount', key: 'Amount', width: 15 },
        { header: 'Note', key: 'Note', width: 30 }
      ];

      // Bold headers
      sheet.getRow(1).font = { bold: true };

      data.forEach(row => {
        sheet.addRow(row);
      });

      // Format Amount column as numbers/currency
      sheet.getColumn('Amount').numFmt = '"$"#,##0.00';

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      
      await workbook.xlsx.write(res);
      return res.end();
    }
  } catch (error) {
    next(error);
  }
};
