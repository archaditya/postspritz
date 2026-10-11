import { Request, Response, NextFunction } from 'express';
import { postsService } from '../../container';
import { ApiResponse } from '../../utils/apiResponse';

export class PostsController {
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postsService.createPost(req.user!.id, req.body);
      ApiResponse.created(res, result, 'Post created and scheduled successfully');
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await postsService.getPost(req.params.id, req.user!.id);
      ApiResponse.success(res, post, 'Post retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postsService.listPosts(req.user!.id, req.query as any);
      ApiResponse.paginated(
        res,
        result.posts,
        result.total,
        result.page,
        result.limit,
        'Posts retrieved successfully'
      );
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postsService.deletePost(req.params.id, req.user!.id);
      ApiResponse.success(res, result, 'Post deleted successfully');
    } catch (err) {
      next(err);
    }
  };

  estimateCost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const estimate = postsService.estimateCost(req.body.content || '', req.body.platform);
      ApiResponse.success(res, estimate, 'Platform cost estimate calculated');
    } catch (err) {
      next(err);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postsService.publishNow(req.params.id, req.user!.id);
      ApiResponse.success(res, result, 'Post publication job queued');
    } catch (err) {
      next(err);
    }
  };

  retry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postsService.retryFailed(req.params.id, req.user!.id);
      ApiResponse.success(res, result, 'Failed post target retry job queued');
    } catch (err) {
      next(err);
    }
  };
}
