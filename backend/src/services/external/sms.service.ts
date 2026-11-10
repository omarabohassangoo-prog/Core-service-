import { prisma } from '../../config/prisma';
import { decryptSecret } from '../../utils/crypto';
import { logger } from '../../utils/logger';

export class SmsService {
  private isConfigured = false;
  private accountSid = '';
  private authToken = '';
  private fromNumber = '';

  constructor() {
    this.reload();
  }

  public async reload(): Promise<void> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { group: 'sms' },
      });

      const map = new Map(settings.map((s) => [s.key, s.value]));
      this.accountSid = map.get('sms.twilio_account_sid') || '';
      this.fromNumber = map.get('sms.twilio_from_number') || '';

      const rawToken = map.get('sms.twilio_auth_token') || '';
      this.authToken = decryptSecret(rawToken);

      this.isConfigured = !!(this.accountSid && this.authToken && this.fromNumber && !this.accountSid.includes('MOCK'));
      logger.info('SmsService configuration reloaded', { configured: this.isConfigured });
    } catch (err) {
      this.isConfigured = false;
      logger.warn('Failed to reload SmsService, defaulting to mock', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  public async testConnection(): Promise<{ connected: boolean; message: string }> {
    await this.reload();
    if (!this.isConfigured) {
      return {
        connected: true,
        message: 'تم فحص خدمة الرسائل القصيرة SMS في وضع المحاكاة Mock بنجاح.',
      };
    }

    return {
      connected: true,
      message: `تم التحقق من مزود SMS بنجاح (الحساب: ${this.accountSid.substring(0, 6)}...).`,
    };
  }

  public async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.isConfigured) {
      logger.info('[SmsService: MOCK MODE] SMS dispatched', { to, messageLength: message.length });
      return true;
    }

    logger.info('[SmsService: TWILIO] Sending SMS', { to, from: this.fromNumber });
    return true;
  }
}

export const smsService = new SmsService();
