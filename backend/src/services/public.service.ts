import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';
import { ContactMessageInput } from '../schemas/public.schema';
import { logger } from '../utils/logger';

export class PublicService {
  public async getPageBySlug(slug: string) {
    const page = await prisma.page.findFirst({
      where: {
        slug,
        isPublished: true,
        deletedAt: null,
      },
    });

    if (!page) {
      throw new AppError(`الصفحة المطلوبة [${slug}] غير متوفرة أو تم إلغاء نشرها`, 404, 'PAGE_NOT_FOUND');
    }

    return page;
  }

  public async listPublishedPages() {
    return prisma.page.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        metaTitle: true,
        metaDescription: true,
      },
      orderBy: { id: 'asc' },
      take: 50,
    });
  }

  public async submitContactMessage(input: ContactMessageInput) {
    const message = await prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        subject: input.subject,
        message: input.message,
        status: 'NEW',
      },
    });

    logger.info('Public contact inquiry submitted', {
      messageId: message.id,
      email: message.email,
      subject: message.subject,
    });

    return {
      messageId: message.id,
      message: 'تم استلام رسالتك بنجاح، وسيتواصل معك فريق الدعم الفني قريباً.',
    };
  }

  public async getPublicSettings() {
    // Only return non-secret general, css, and i18n settings to public
    const settings = await prisma.systemSetting.findMany({
      where: {
        isSecret: false,
        group: { in: ['general', 'css', 'i18n'] },
      },
      select: {
        key: true,
        value: true,
        group: true,
      },
      take: 50,
    });

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }
}

export const publicService = new PublicService();
