import { Router } from 'express';
import { FollowUpController } from './followup.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createFollowUpSchema, PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.FOLLOWUPS_VIEW), FollowUpController.listFollowUps);
router.post(
  '/',
  requirePermission(PERMISSIONS.FOLLOWUPS_CREATE),
  validateRequest(createFollowUpSchema),
  FollowUpController.createFollowUp
);
router.put('/:id/status', requirePermission(PERMISSIONS.FOLLOWUPS_UPDATE), FollowUpController.updateStatus);

export default router;
