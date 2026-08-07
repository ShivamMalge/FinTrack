import { Router } from 'express';
import { create, getAll, update, remove } from './controller';
import { validate } from '../../middleware/validate';
import { requireRole } from '../../middleware/auth';
import { createCategorySchema, updateCategorySchema } from './dto';

const router = Router();

router.get('/', getAll);
router.post('/', requireRole('ADMIN'), validate(createCategorySchema), create);
router.put('/:id', requireRole('ADMIN'), validate(updateCategorySchema), update);
router.delete('/:id', requireRole('ADMIN'), remove);

export default router;
