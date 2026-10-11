import { Request, Response, NextFunction } from 'express';
import { socialAccountsService } from '../../container';
import { SocialPlatform } from '@pushpost/shared-types';
import { ApiResponse } from '../../utils/apiResponse';

export class SocialAccountsController {
  getAuthUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const platform = req.params.platform as SocialPlatform;
      const url = await socialAccountsService.getAuthUrl(platform, req.user!.id);
      ApiResponse.success(res, { url }, 'OAuth authorization URL generated');
    } catch (err) {
      next(err);
    }
  };

  callback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = (req.query.code || req.body.code) as string;
      const state = (req.query.state || req.body.state) as string;
      const codeVerifier = (req.query.code_verifier || req.body.codeVerifier) as string | undefined;

      const account = await socialAccountsService.handleCallback(code, state, codeVerifier);

      // If redirect callback from browser, send JSON or redirect to web dashboard
      if (req.accepts('html')) {
        return res.redirect(`/dashboard/accounts?connected=${account.platform}`);
      }

      ApiResponse.created(res, account, 'Account connected successfully');
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const search = (req.query.search as string) || undefined;
      const platform = (req.query.platform as string) || undefined;
      const status = (req.query.status as string) || undefined;

      const result = await socialAccountsService.listAccounts(req.user!.id, {
        page,
        limit,
        search,
        platform,
        status
      });

      if (req.query.page || req.query.limit) {
        ApiResponse.paginated(
          res,
          result.accounts,
          result.total,
          result.page,
          result.limit,
          'Social accounts retrieved successfully'
        );
      } else {
        ApiResponse.success(res, result.accounts, 'Social accounts retrieved successfully');
      }
    } catch (err) {
      next(err);
    }
  };

  disconnect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await socialAccountsService.disconnectAccount(req.params.id, req.user!.id);
      ApiResponse.success(res, result, 'Social account disconnected successfully');
    } catch (err) {
      next(err);
    }
  };
}
