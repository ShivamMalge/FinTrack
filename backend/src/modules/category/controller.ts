import { Request, Response, NextFunction } from 'express';
import { createCategory, getCategories, updateCategory, deleteCategory } from './service';
import { successResponse, errorResponse } from '../../utils/apiResponse';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await createCategory(req.body);
    res.status(201).json(successResponse(category));
  } catch (error: any) {
    if (error.message === 'CONFLICT') {
      res.status(409).json(errorResponse('CONFLICT', 'Category name already exists'));
    } else {
      next(error);
    }
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getCategories();
    res.status(200).json(successResponse(categories));
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await updateCategory(req.params.id as string, req.body);
    res.status(200).json(successResponse(category));
  } catch (error: any) {
    if (error.message === 'CONFLICT') {
      res.status(409).json(errorResponse('CONFLICT', 'Category name already exists'));
    } else if (error.code === 'P2025') {
      res.status(404).json(errorResponse('NOT_FOUND', 'Category not found'));
    } else {
      next(error);
    }
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteCategory(req.params.id as string);
    res.status(200).json(successResponse({ success: true }));
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json(errorResponse('NOT_FOUND', 'Category not found'));
    } else {
      next(error);
    }
  }
};
