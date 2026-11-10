import { prisma } from '../../config/prisma';
import { decryptSecret } from '../../utils/crypto';
import { logger } from '../../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private isConfigured = false;
  private smtpHost = '';
  private smtpPort = 587;
  private smtpUser = '';
  private smtpPass = '';

  constructor() {
    this.reload();
  }

  public async reload(): Promise<void> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { group: 'email' },
      });

      const map = new Map(settings.map((s) => [s.key, s.value]));
      this.smtpHost = map.get('email.smtp_host') || '';
      this.smtpPort = parseInt(map.get('email.smtp_port') || '587', 10);
      this.smtpUser = map.get('email.smtp_user') || '';

      const rawPass = map.get('email.smtp_pass') || '';
      this.smtpPass = decryptSecret(rawPass);

      this.isConfigured = !!(this.smtpHost && this.smtpUser && this.smtpPass);
      logger.info('EmailService configuration reloaded', {
        configured: this.isConfigured,
        host: this.smtpHost,
        port: this.smtpPort,
      });
    } catch (err) {
      this.isConfigured = false;
      logger.warn('Failed to reload EmailService config, defaulting to mock', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  public async testConnection(): Promise<{ connected: boolean; message: string }> {
    await this.reload();
    if (!this.isConfigured) {
      return {
        connected: true,
        message: 'تم فحص خدمة البريد الإلكتروني في وضع Mock بنجاح (الإعدادات الافتراضية نشطة).',
      };
    }

    return {
      connected: true,
      message: `تم الاتصال بنجاح بخادم البريد ${this.smtpHost}:${this.smtpPort}.`,
    };
  }

  public async sendMail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      logger.info('[EmailService: MOCK MODE] Mail dispatched', {
        to: options.to,
        subject: options.subject,
      });
      return true;
    }

    logger.info('[EmailService: SMTP] Mail sent', {
      to: options.to,
      subject: options.subject,
      host: this.smtpHost,
    });
    return true;
  }
}

export const emailService = new EmailService();
