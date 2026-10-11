import { Router } from 'express';
import { AiContentController } from './ai-content.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AiContentController();

router.use(authenticate);

// Text generation routes (both standard & frontend aliases)
router.post('/generate-text', controller.generateText);
router.post('/generate-post', controller.generateText);

// Visual prompts & image expansion routes (hard-capped to max 5)
router.post('/generate-images', controller.generateImages);
router.post('/expand-image-prompts', controller.generateImages);

export const aiContentRoutes = router;
