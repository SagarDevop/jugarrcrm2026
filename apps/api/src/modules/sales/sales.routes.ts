import { Router } from 'express';
import { SalesController } from './sales.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', SalesController.getMyDashboard);

export default router;
