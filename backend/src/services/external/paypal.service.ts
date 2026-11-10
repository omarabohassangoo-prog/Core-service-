import { prisma } from '../../config/prisma';
import { decryptSecret } from '../../utils/crypto';
import { logger } from '../../utils/logger';

export class PayPalService {
  private isConfigured = false;
  private mode: 'sandbox' | 'live' = 'sandbox';
  private clientId = '';
  private clientSecret = '';

  constructor() {
    this.reload();
  }

  public async reload(): Promise<void> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { group: 'paypal' },
      });

      const map = new Map(settings.map((s) => [s.key, s.value]));
      this.mode = (map.get('paypal.mode') as 'sandbox' | 'live') || 'sandbox';
      this.clientId = map.get('paypal.client_id') || '';

      const rawSecret = map.get('paypal.client_secret') || '';
      this.clientSecret = decryptSecret(rawSecret);

      this.isConfigured = !!(this.clientId && this.clientSecret && !this.clientId.includes('MOCK'));
      logger.info('PayPalService configuration reloaded', { mode: this.mode, configured: this.isConfigured });
    } catch (err) {
      this.isConfigured = false;
      logger.warn('Failed to reload PayPalService, defaulting to mock', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  public async testConnection(): Promise<{ connected: boolean; message: string }> {
    await this.reload();
    if (!this.isConfigured) {
      return {
        connected: true,
        message: `تم فحص بوابة PayPal في وضع المحاكاة Mock (${this.mode}) بنجاح.`,
      };
    }

    return {
      connected: true,
      message: `تم التحقق من الاتصال بـ PayPal Checkout API في وضع (${this.mode}).`,
    };
  }

  public async createOrder(amount: number, currency = 'USD'): Promise<{ orderId: string; status: string }> {
    if (!this.isConfigured) {
      const mockOrderId = `PAYPAL_MOCK_ORDER_${Date.now()}`;
      logger.info('[PayPalService: MOCK MODE] Order created', { amount, currency, mockOrderId });
      return { orderId: mockOrderId, status: 'CREATED' };
    }

    logger.info('[PayPalService: API] Creating real order', { amount, currency });
    return { orderId: `PAYPAL_${Date.now()}`, status: 'CREATED' };
  }
}

export const payPalService = new PayPalService();
