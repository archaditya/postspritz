import { Request, Response, NextFunction } from 'express';
import { ApiKeysService } from './api-keys.service';

export class ApiKeysController {
  private service: ApiKeysService;

  constructor() {
    this.service = new ApiKeysService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, scopes } = req.body;
      const result = await this.service.createKey(req.user!.id, name || 'Default Key', scopes);
      res.status(201).json({
        success: true,
        message: 'API Key created. Copy it now, it will not be shown again.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keys = await this.service.listKeys(req.user!.id);
      res.json({
        success: true,
        data: keys
      });
    } catch (err) {
      next(err);
    }
  };

  revoke = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.revokeKey(req.params.id, req.user!.id);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  };
}
