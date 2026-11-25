import { Router } from 'express';
import { ContentController } from './content.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ContentController.listContent);
router.post('/', ContentController.createContent);
router.post('/ai-assistant', ContentController.generateAiPrompt);

export default router;
