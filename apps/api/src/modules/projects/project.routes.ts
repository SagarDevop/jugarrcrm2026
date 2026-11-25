import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createProjectSchema, PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', ProjectController.listProjects);
router.post(
  '/',
  requirePermission(PERMISSIONS.PROJECTS_CREATE),
  validateRequest(createProjectSchema),
  ProjectController.createProject
);
router.get('/:id', ProjectController.getProjectById);
router.put('/:id', requirePermission(PERMISSIONS.PROJECTS_UPDATE), ProjectController.updateProject);
router.put(
  '/:id/milestones/:milestoneId',
  requirePermission(PERMISSIONS.PROJECTS_UPDATE),
  ProjectController.updateMilestone
);

export default router;
