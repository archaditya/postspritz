import { Router } from 'express';
import { ApiKeysController } from './api-keys.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new ApiKeysController();

router.use(authenticate);

router.post('/', controller.create);
router.get('/', controller.list);
router.delete('/:id', controller.revoke);

export const apiKeysRoutes = router;
