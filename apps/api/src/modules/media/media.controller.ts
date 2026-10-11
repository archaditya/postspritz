import { Request, Response, NextFunction } from 'express';
import { mediaService } from '../../container';
import { ApiResponse } from '../../utils/apiResponse';

export class MediaController {
  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const media = await mediaService.handleUpload(req.user!.id, req.file!);
      ApiResponse.created(res, media, 'Media file uploaded successfully');
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const search = (req.query.search as string) || undefined;
      const mimeType = (req.query.mimeType as string) || undefined;

      const result = await mediaService.listMedia(req.user!.id, { page, limit, search, mimeType });
      ApiResponse.paginated(
        res,
        result.media,
        result.total,
        result.page,
        result.limit,
        'Media assets retrieved successfully'
      );
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const media = await mediaService.getMedia(req.params.id, req.user!.id);
      ApiResponse.success(res, media, 'Media asset retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await mediaService.deleteMedia(req.params.id, req.user!.id);
      ApiResponse.success(res, result, 'Media asset deleted successfully');
    } catch (err) {
      next(err);
    }
  };
}
