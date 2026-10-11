import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getOverview(req.user!.id);
      res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  };

  getRecentPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getRecentPerformance(req.user!.id);
      res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  };
}
