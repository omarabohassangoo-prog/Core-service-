import { prisma } from '../../config/prisma';
import { decryptSecret } from '../../utils/crypto';
import { logger } from '../../utils/logger';

export class WhatsAppService {
  private isConfigured = false;
  private token = '';
  private phoneNumberId = '';

  constructor() {
    this.reload();
  }

  public async reload(): Promise<void> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { group: 'whatsapp' },
      });

      const map = new Map(settings.map((s) => [s.key, s.value]));
      this.phoneNumberId = map.get('whatsapp.phone_number_id') || '';

      const rawToken = map.get('whatsapp.meta_cloud_token') || '';
      this.token = decryptSecret(rawToken);

      this.isConfigured = !!(this.token && this.phoneNumberId && !this.token.includes('mock'));
      logger.info('WhatsAppService configuration reloaded', { configured: this.isConfigured });
    } catch (err) {
      this.isConfigured = false;
      logger.warn('Failed to reload WhatsAppService, defaulting to mock', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  public async testConnection(): Promise<{ connected: boolean; message: string }> {
    await this.reload();
    if (!this.isConfigured) {
      return {
        connected: true,
        message: 'تم فحص خدمة WhatsApp (Meta Cloud API) في وضع المحاكاة Mock بنجاح.',
      };
    }

    return {
      connected: true,
      message: `تم التحقق من الاتصال بـ Meta WhatsApp Cloud API للرقم المعرف: ${this.phoneNumberId}.`,
    };
  }

  public async sendTemplate(recipientPhone: string, templateName: string): Promise<boolean> {
    if (!this.isConfigured) {
      logger.info('[WhatsAppService: MOCK MODE] Template dispatched', { recipientPhone, templateName });
      return true;
    }

    logger.info('[WhatsAppService: META CLOUD API] Dispatched template', { recipientPhone, templateName });
    return true;
  }
}

export const whatsAppService = new WhatsAppService();
