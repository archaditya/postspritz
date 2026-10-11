import { Router } from 'express';
import multer from 'multer';
import { MediaController } from './media.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateParams } from '../../middlewares/validate.middleware';
import { idParamSchema } from '../../schemas/common.schemas';

const router = Router();
const controller = new MediaController();

// In-memory buffer storage for multer before streaming to S3/MinIO
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

router.use(authenticate);

router.post('/upload', upload.single('file'), controller.upload);
router.get('/', controller.list);
router.get('/:id', validateParams(idParamSchema), controller.get);
router.delete('/:id', validateParams(idParamSchema), controller.delete);

export const mediaRoutes = router;
