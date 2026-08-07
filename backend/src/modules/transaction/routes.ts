import { Router } from 'express';
import { create, getAll, getOne, update, remove, exportTransactions } from './controller';
import { validate } from '../../middleware/validate';
import { createTransactionSchema, updateTransactionSchema } from './dto';

const router = Router();

// Notice that the authentication middleware will be applied at the parent router in server.ts
router.post('/', validate(createTransactionSchema), create);
router.get('/export', exportTransactions);
router.get('/', getAll);
router.get('/:id', getOne);
router.put('/:id', validate(updateTransactionSchema), update);
router.delete('/:id', remove);

export default router;
