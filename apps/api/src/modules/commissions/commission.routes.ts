import { Router } from 'express';
import { CommissionController } from './commission.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', CommissionController.listCommissions);

export default router;
