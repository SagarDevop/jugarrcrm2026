import { Router } from 'express';
import { ClientController } from './client.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createClientSchema, updateClientSchema, PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', ClientController.listClients);
router.post(
  '/',
  requirePermission(PERMISSIONS.CLIENTS_CREATE),
  validateRequest(createClientSchema),
  ClientController.createClient
);
router.get('/:id', ClientController.getClientById);
router.put('/:id', validateRequest(updateClientSchema), ClientController.updateClient);

export default router;
