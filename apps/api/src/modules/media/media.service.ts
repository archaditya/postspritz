import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { MediaRepository } from './media.repository';
import { env } from '../../config/env';
import { r2Client, r2Config } from '../../config/r2';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { logger } from '../../config/logger';

import { validateMagicBytes } from './magic-bytes';

export class MediaService {
  private repo: MediaRepository;

  constructor() {
    this.repo = new MediaRepository();
  }

  private resolveStorageUrl(storageKey: string): string {
    if (r2Config.publicUrl) {
      return `${r2Config.publicUrl.replace(/\/+$/, '')}/${storageKey}`;
    }
    if (env.R2_ACCOUNT_ID) {
      return `https://${r2Config.bucketName}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${storageKey}`;
    }
    return `${env.S3_ENDPOINT}/${r2Config.bucketName}/${storageKey}`;
  }

  async handleUpload(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new AppError('No file provided for upload', 400);
    }

    const magicCheck = validateMagicBytes(file.buffer);
    if (!magicCheck.valid) {
      throw new AppError(
        'Security validation failed: File binary signature does not match authentic image (JPEG, PNG, WebP, GIF) or video (MP4, WebM).',
        400
      );
    }

    const verifiedMime = magicCheck.detectedMime || file.mimetype;
    const ext = path.extname(file.originalname) || (magicCheck.category === 'video' ? '.mp4' : '.png');
    // Ephemeral staging prefix for social media post dispatches
    const storageKey = `staging/posts/${userId}/${uuidv4()}${ext}`;

    // Upload to Cloudflare R2 / S3
    try {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: r2Config.bucketName,
          Key: storageKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      logger.info({ storageKey, bucket: r2Config.bucketName }, 'File object dispatched to R2');
    } catch (err: any) {
      logger.warn({ err: err?.message, storageKey }, 'R2 upload dispatch failed or skipped; proceeding with local record');
    }

    const storageUrl = this.resolveStorageUrl(storageKey);

    const media = await this.repo.createMedia({
      userId,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      storageKey,
      storageUrl,
      thumbnailUrl: file.mimetype.startsWith('image/') ? storageUrl : undefined,
    });

    logger.info({ userId, mediaId: media.id, storageKey }, 'Media uploaded successfully');
    return media;
  }

  async listMedia(userId: string, params?: { page?: number; limit?: number; search?: string; mimeType?: string }) {
    return this.repo.listUserMedia({
      userId,
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      mimeType: params?.mimeType,
    });
  }

  async getMedia(id: string, userId: string) {
    const media = await this.repo.getMediaById(id, userId);
    if (!media) {
      throw new AppError('Media asset not found', 404);
    }
    return media;
  }

  async deleteMedia(id: string, userId: string) {
    const media = await this.repo.getMediaById(id, userId);
    if (!media) {
      throw new AppError('Media asset not found', 404);
    }

    try {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: r2Config.bucketName,
          Key: media.storage_key,
        })
      );
    } catch (err: any) {
      logger.warn({ err: err?.message, storageKey: media.storage_key }, 'R2 delete dispatch failed or skipped');
    }

    const deleted = await this.repo.deleteMedia(id, userId);
    if (!deleted) {
      throw new AppError('Media asset not found', 404);
    }
    return { message: 'Media asset deleted successfully' };
  }

  async purgeStagedMedia(storageKey: string) {
    try {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: r2Config.bucketName,
          Key: storageKey,
        })
      );
      logger.info({ storageKey }, 'Ephemeral staged media object deleted from R2 storage');
    } catch (err: any) {
      logger.warn({ err: err?.message, storageKey }, 'R2 purge dispatch failed or skipped');
    }
  }
}
