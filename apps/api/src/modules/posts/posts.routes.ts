import { Router } from 'express';
import { PostsController } from './posts.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate, validateBody, validateQuery, validateParams } from '../../middlewares/validate.middleware';
import { createPostSchema, listPostsQuerySchema, estimateCostSchema } from './posts.schemas';
import { idParamSchema } from '../../schemas/common.schemas';

const router = Router();
const controller = new PostsController();

router.use(authenticate); // All post endpoints require authentication

router.post('/', validateBody(createPostSchema), controller.create);
router.get('/', validateQuery(listPostsQuerySchema), controller.list);
router.get('/:id', validateParams(idParamSchema), controller.get);
router.delete('/:id', validateParams(idParamSchema), controller.delete);
router.post('/:id/publish', validateParams(idParamSchema), controller.publish);
router.post('/:id/retry', validateParams(idParamSchema), controller.retry);
router.post('/estimate-cost', validateBody(estimateCostSchema), controller.estimateCost);

export const postsRoutes = router;
