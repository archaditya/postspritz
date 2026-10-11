import { Request, Response, NextFunction } from 'express';
import { ContactService } from './contact.service';
import { AppError } from '../../middlewares/errorHandler.middleware';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ContactController {
  private service: ContactService;

  constructor() {
    this.service = new ContactService();
  }

  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        throw new AppError('Full name is required (minimum 2 characters)', 400);
      }

      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        throw new AppError('A valid email address is required', 400);
      }

      if (!message || typeof message !== 'string' || message.trim().length < 5) {
        throw new AppError('Message is required (minimum 5 characters)', 400);
      }

      const ipAddress = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.headers['user-agent'] || undefined;

      const inquiry = await this.service.submitInquiry({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject?.trim() || undefined,
        message: message.trim(),
        ipAddress,
        userAgent,
      });

      res.status(201).json({
        success: true,
        data: {
          id: inquiry.id,
          message: 'Your inquiry has been received. Our team will review and respond shortly.',
        },
      });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Number(req.query.offset) || 0;
      const inquiries = await this.service.getInquiries(limit, offset);

      res.json({
        success: true,
        data: inquiries,
      });
    } catch (err) {
      next(err);
    }
  };
}
