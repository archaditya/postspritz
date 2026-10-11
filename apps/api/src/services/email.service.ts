import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class EmailService {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '../emails/templates');
  }

  private loadTemplate(name: string, data: Record<string, string>): string {
    const filePath = path.join(this.templatesDir, `${name}.html`);
    if (!fs.existsSync(filePath)) {
      return `<p>${data.message || ''}</p>`;
    }
    let html = fs.readFileSync(filePath, 'utf8');
    for (const [key, value] of Object.entries(data)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return html;
  }

  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!env.BREVO_API_KEY) {
      logger.info({ to, subject }, 'BREVO_API_KEY not configured. Email logged to console (mock mode).');
      return true;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: env.BREVO_SENDER_NAME,
            email: env.BREVO_SENDER_EMAIL
          },
          to: [{ email: to }],
          subject,
          htmlContent
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ errorText, status: response.status }, 'Failed to send email via Brevo');
        return false;
      }

      logger.info({ to, subject }, 'Email sent successfully via Brevo');
      return true;
    } catch (err) {
      logger.error({ err }, 'Error sending email');
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name?: string | null): Promise<boolean> {
    const html = this.loadTemplate('welcome', {
      name: name || 'there',
      dashboardUrl: `${env.WEB_BASE_URL}/dashboard`
    });
    return this.sendEmail(to, 'Welcome to PostSpritz! 🚀', html);
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verifyUrl = `${env.WEB_BASE_URL}/verify-email?token=${token}`;
    const html = this.loadTemplate('verify-email', {
      verifyUrl
    });
    return this.sendEmail(to, 'Verify your PostSpritz email address', html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetUrl = `${env.WEB_BASE_URL}/reset-password?token=${token}`;
    const html = this.loadTemplate('reset-password', {
      resetUrl
    });
    return this.sendEmail(to, 'Reset your PostSpritz password', html);
  }
}

export const emailService = new EmailService();
