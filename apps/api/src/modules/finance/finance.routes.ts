import { Router } from 'express';
import { FinanceController } from './finance.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/overview', requirePermission(PERMISSIONS.FINANCE_VIEW_REPORTS), FinanceController.getOverview);

export default router;
