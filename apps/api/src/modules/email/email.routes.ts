import { Router } from 'express';
import { EmailController } from './email.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/status', EmailController.getStatus);
router.post('/send-client', EmailController.sendClientEmail);
router.post('/send-payment-receipt/:paymentId', EmailController.sendPaymentReceipt);

export default router;
