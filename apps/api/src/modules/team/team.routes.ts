import { Router } from 'express';
import { TeamController } from './team.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { USER_ROLES } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

// List team users
router.get('/', TeamController.listUsers);

// Admin-only management
router.post('/', requireRole(USER_ROLES.SUPER_ADMIN), TeamController.createMember);
router.put('/:id', requireRole(USER_ROLES.SUPER_ADMIN), TeamController.updateMember);
router.delete('/:id', requireRole(USER_ROLES.SUPER_ADMIN), TeamController.deleteMember);
router.post('/:id/reset-password', requireRole(USER_ROLES.SUPER_ADMIN), TeamController.resetPassword);

export default router;
