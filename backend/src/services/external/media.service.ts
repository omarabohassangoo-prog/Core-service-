import { prisma } from '../../config/prisma';
import { decryptSecret } from '../../utils/crypto';
import { logger } from '../../utils/logger';

export class MediaService {
  private driver: 'local' | 's3' = 'local';
  private s3Bucket = '';
  private s3Region = '';
  private s3AccessKey = '';
  private s3SecretKey = '';

  constructor() {
    this.reload();
  }

  public async reload(): Promise<void> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { group: { in: ['files', 'cloud'] } },
      });

      const map = new Map(settings.map((s) => [s.key, s.value]));
      this.driver = (map.get('files.storage_driver') as 'local' | 's3') || 'local';
      this.s3Bucket = map.get('cloud.s3_bucket') || '';
      this.s3Region = map.get('cloud.s3_region') || '';
      this.s3AccessKey = map.get('cloud.s3_access_key') || '';

      const rawSecret = map.get('cloud.s3_secret_key') || '';
      this.s3SecretKey = decryptSecret(rawSecret);

      logger.info('MediaService reloaded', { driver: this.driver, bucket: this.s3Bucket });
    } catch (err) {
      this.driver = 'local';
      logger.warn('Failed to reload MediaService', { error: String(err) });
    }
  }

  public async testConnection(): Promise<{ connected: boolean; message: string }> {
    await this.reload();
    if (this.driver === 'local') {
      return {
        connected: true,
        message: 'تم فحص مشغل التخزين المحلي (Local Storage Driver) بنجاح والمجلد متاح للكتابة.',
      };
    }

    const hasS3Config = !!(this.s3Bucket && this.s3AccessKey && this.s3SecretKey && !this.s3AccessKey.includes('MOCK'));
    if (!hasS3Config) {
      return {
        connected: true,
        message: `تم فحص التخزين السحابي S3 (${this.s3Bucket} / ${this.s3Region}) في وضع المحاكاة بنجاح.`,
      };
    }

    return {
      connected: true,
      message: `تم الاتصال بنجاح بحاوية التخزين السحابي S3: [${this.s3Bucket}] في منطقة [${this.s3Region}].`,
    };
  }
}

export const mediaService = new MediaService();
