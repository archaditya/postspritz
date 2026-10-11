import bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { encryptToken } from '../../utils/crypto.utils';

export class UsersService {
  private usersRepo: UsersRepository;

  constructor() {
    this.usersRepo = new UsersRepository();
  }

  async getProfile(userId: string) {
    const user = await this.usersRepo.getProfile(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async updateProfile(userId: string, data: any) {
    return this.usersRepo.updateProfile(userId, data);
  }

  async updatePassword(userId: string, currentPass: string, newPass: string) {
    const currentHash = await this.usersRepo.getPasswordHash(userId);
    if (!currentHash) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPass, currentHash);
    if (!isMatch) {
      throw new AppError('Incorrect current password', 400);
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPass, salt);
    await this.usersRepo.updatePasswordHash(userId, newHash);

    return { message: 'Password updated successfully' };
  }

  async updateNotifications(userId: string, settings: any) {
    return this.usersRepo.updateNotificationSettings(userId, settings);
  }

  async updatePlatformSettings(userId: string, settings: any) {
    return this.usersRepo.updatePreferences(userId, { platform_settings: settings });
  }

  async updateAiConfig(userId: string, config: { provider: 'platform' | 'byok'; byok_provider?: 'gemini' | 'openai'; api_key?: string }) {
    let encryptedKey: string | null = null;
    if (config.provider === 'byok' && config.api_key) {
      encryptedKey = encryptToken(config.api_key);
    }

    return this.usersRepo.updateAiConfig(userId, {
      provider: config.provider,
      byok_provider: config.byok_provider || null,
      api_key_enc: encryptedKey
    });
  }
}
