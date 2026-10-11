import { query } from '../../db/pool';

export interface CreateInquiryDto {
  name: string;
  email: string;
  subject?: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ContactRepository {
  async create(data: CreateInquiryDto) {
    const res = await query(
      `INSERT INTO contact_inquiries (name, email, subject, message, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, subject, message, status, created_at`,
      [
        data.name,
        data.email,
        data.subject || null,
        data.message,
        data.ipAddress || null,
        data.userAgent || null,
      ]
    );
    return res.rows[0];
  }

  async list(limit = 50, offset = 0) {
    const res = await query(
      `SELECT id, name, email, subject, message, status, ip_address, created_at
       FROM contact_inquiries
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  }
}
