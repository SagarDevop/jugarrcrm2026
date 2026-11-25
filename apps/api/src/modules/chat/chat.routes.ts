import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/rooms', ChatController.listRooms);
router.post('/rooms', ChatController.createRoom);
router.get('/rooms/:roomId/messages', ChatController.listMessages);
router.post('/rooms/:roomId/messages', ChatController.sendMessage);

export default router;
