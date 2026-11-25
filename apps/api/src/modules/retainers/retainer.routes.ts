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
router.put('/:id/deliverables', requirePermission(PERMISSIONS.RETAINERS_MANAGE), RetainerController.updateDeliverables);

export default router;
