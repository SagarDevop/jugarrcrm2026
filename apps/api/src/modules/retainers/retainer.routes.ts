import { Router } from 'express';
import { RetainerController } from './retainer.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createRetainerSchema, PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', RetainerController.listRetainers);
router.post(
  '/',
  requirePermission(PERMISSIONS.RETAINERS_MANAGE),
  validateRequest(createRetainerSchema),
  RetainerController.createRetainer
);
router.post('/:id/renew', requirePermission(PERMISSIONS.RETAINERS_MANAGE), RetainerController.renewPeriod);
router.post('/:id/period-payment', requirePermission(PERMISSIONS.RETAINERS_MANAGE), RetainerController.recordPeriodPayment);
router.put('/:id/period', requirePermission(PERMISSIONS.RETAINERS_MANAGE), RetainerController.updatePeriod);
router.put('/:id/deliverables', requirePermission(PERMISSIONS.RETAINERS_MANAGE), RetainerController.updateDeliverables);

export default router;
