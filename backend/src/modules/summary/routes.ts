import { Router } from 'express';
import { getSummaryData } from './controller';

const router = Router();

router.get('/', getSummaryData);

export default router;
