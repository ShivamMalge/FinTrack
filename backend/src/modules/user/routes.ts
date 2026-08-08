import { Router } from 'express';
import { getAllUsers } from './controller';

const router = Router();

router.get('/', getAllUsers);

export default router;
