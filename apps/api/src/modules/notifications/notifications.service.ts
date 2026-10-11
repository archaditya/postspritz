import { NotificationsRepository } from './notifications.repository';

export class NotificationsService {
  private repo: NotificationsRepository;

  constructor() {
    this.repo = new NotificationsRepository();
  }

  async list(userId: string, page = 1, limit = 20, unreadOnly = false) {
    return this.repo.listNotifications(userId, page, limit, unreadOnly);
  }

  async markAsRead(id: string, userId: string) {
    return this.repo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.repo.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string) {
    return this.repo.getUnreadCount(userId);
  }
}
