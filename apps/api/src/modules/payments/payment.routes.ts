import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { createPaymentSchema, verifyPaymentSchema, PERMISSIONS } from '@agencyos/shared';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.PAYMENTS_VIEW), PaymentController.listPayments);
router.post(
  '/',
  requirePermission(PERMISSIONS.PAYMENTS_CREATE),
  validateRequest(createPaymentSchema),
  PaymentController.recordPayment
);
router.post(
  '/:id/verify',
  requirePermission(PERMISSIONS.PAYMENTS_VERIFY),
  validateRequest(verifyPaymentSchema),
  PaymentController.verifyPayment
);

export default router;
