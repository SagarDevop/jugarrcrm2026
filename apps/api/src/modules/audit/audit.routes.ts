import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.AUDIT_VIEW), AuditController.listLogs);

export default router;
