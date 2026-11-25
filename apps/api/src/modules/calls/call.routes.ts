import { Router } from 'express';
import { CallController } from './call.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createCallSchema, PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.CALLS_VIEW), CallController.listCalls);
router.post(
  '/',
  requirePermission(PERMISSIONS.CALLS_CREATE),
  validateRequest(createCallSchema),
  CallController.recordCall
);

export default router;
