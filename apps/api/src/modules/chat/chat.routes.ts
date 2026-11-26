import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/rooms', ChatController.listRooms);
router.get('/unread-count', ChatController.getUnreadCount);
router.post('/rooms', ChatController.createRoom);
router.delete('/rooms/:roomId', ChatController.deleteRoom);
router.get('/rooms/:roomId/messages', ChatController.listMessages);
router.post('/rooms/:roomId/messages', ChatController.sendMessage);
router.post('/rooms/:roomId/read', ChatController.markAsRead);

export default router;
