import { Request, Response, NextFunction } from 'express';
import { aiContentService } from '../../container';

export class AiContentController {
  generateText = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await aiContentService.generateText(req.user!.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  generateImages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await aiContentService.generateImages(req.user!.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
