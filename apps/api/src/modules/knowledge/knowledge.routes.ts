import { Router } from 'express';
import { KnowledgeController } from './knowledge.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createKnowledgeResourceSchema, PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.KNOWLEDGE_VIEW), KnowledgeController.listResources);
router.post(
  '/',
  requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE),
  validateRequest(createKnowledgeResourceSchema),
  KnowledgeController.createResource
);
router.put('/:id', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), KnowledgeController.updateResource);
router.delete('/:id', requirePermission(PERMISSIONS.KNOWLEDGE_MANAGE), KnowledgeController.deleteResource);

export default router;
