import { Router } from 'express';
import { LeadController } from './lead.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createLeadSchema, updateLeadSchema, PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', LeadController.listLeads);
router.post(
  '/',
  requirePermission(PERMISSIONS.LEADS_CREATE),
  validateRequest(createLeadSchema),
  LeadController.createLead
);
router.get('/:id', LeadController.getLeadById);
router.put('/:id', validateRequest(updateLeadSchema), LeadController.updateLead);
router.post('/:id/convert', LeadController.convertLead);

export default router;
