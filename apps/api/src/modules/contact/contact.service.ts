import { ContactRepository, CreateInquiryDto } from './contact.repository';
import { query } from '../../db/pool';
import { logger } from '../../config/logger';

export class ContactService {
  private repo: ContactRepository;

  constructor() {
    this.repo = new ContactRepository();
  }

  async submitInquiry(data: CreateInquiryDto) {
    const inquiry = await this.repo.create(data);

    // Notify superadmins in-app
    try {
      const admins = await query(
        `SELECT id FROM users WHERE role IN ('superadmin', 'admin') AND status = 'active'`
      );

      for (const admin of admins.rows) {
        await query(
          `INSERT INTO notifications (user_id, type, title, body, action_url, action_label, channels)
           VALUES ($1, 'contact_inquiry', $2, $3, '/dashboard/admin', 'View Inquiry', '{inapp}')`,
          [
            admin.id,
            `New Contact Inquiry from ${data.name}`,
            data.subject ? `${data.subject}: ${data.message.slice(0, 120)}` : data.message.slice(0, 120),
          ]
        );
      }
    } catch (notifyErr) {
      logger.warn({ notifyErr }, 'Failed to insert admin notification for contact inquiry');
    }

    return inquiry;
  }

  async getInquiries(limit = 50, offset = 0) {
    return this.repo.list(limit, offset);
  }

  async updateInquiryStatus(id: string, status: string) {
    const validStatuses = ['new', 'in_progress', 'resolved', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = await this.repo.updateStatus(id, status);
    if (!updated) {
      throw new Error('Inquiry not found');
    }
    return updated;
  }
}
