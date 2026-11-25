import { Router } from 'express';
import { ExpenseController } from './expense.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createExpenseSchema, PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.EXPENSES_VIEW), ExpenseController.listExpenses);
router.post(
  '/',
  requirePermission(PERMISSIONS.EXPENSES_CREATE),
  validateRequest(createExpenseSchema),
  ExpenseController.createExpense
);
router.put('/:id/approval', requirePermission(PERMISSIONS.EXPENSES_APPROVE), ExpenseController.updateApproval);

export default router;
