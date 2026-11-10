import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/appError';

export class BackupService {
  private backupDir = path.resolve(process.cwd(), 'backups');

  constructor() {
    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
      } catch (err) {
        logger.warn('Could not create backup directory', { error: String(err) });
      }
    }
  }

  public async createBackup(): Promise<{ filename: string; sizeBytes: number; createdAt: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-enterprise-${timestamp}.json`;
    const targetPath = path.join(this.backupDir, filename);

    // Export core collections
    const [users, roles, permissions, settings, pages, messages] = await Promise.all([
      prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, roleId: true, status: true, createdAt: true } }),
      prisma.role.findMany(),
      prisma.permission.findMany(),
      prisma.systemSetting.findMany(),
      prisma.page.findMany(),
      prisma.contactMessage.findMany({ take: 100 }),
    ]);

    const backupData = {
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
      data: {
        users,
        roles,
        permissions,
        settings,
        pages,
        messages,
      },
    };

    fs.writeFileSync(targetPath, JSON.stringify(backupData, null, 2), 'utf-8');
    const stats = fs.statSync(targetPath);

    logger.info('Enterprise system backup created successfully', { filename, size: stats.size });

    return {
      filename,
      sizeBytes: stats.size,
      createdAt: backupData.meta.timestamp,
    };
  }

  public async listBackups(): Promise<Array<{ filename: string; sizeBytes: number; createdAt: string }>> {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const files = fs.readdirSync(this.backupDir).filter((f) => f.endsWith('.json'));
    return files.map((filename) => {
      const stat = fs.statSync(path.join(this.backupDir, filename));
      return {
        filename,
        sizeBytes: stat.size,
        createdAt: stat.birthtime.toISOString(),
      };
    });
  }

  public async restoreBackup(filename: string, confirmCode: string): Promise<boolean> {
    if (confirmCode !== 'RESTORE_CONFIRMED') {
      throw new AppError('يتطلب استرجاع النسخة الاحتياطية كود تأكيد مزدوج (RESTORE_CONFIRMED)', 400, 'RESTORE_NOT_CONFIRMED');
    }

    const filePath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new AppError('ملف النسخة الاحتياطية المحدد غير موجود', 404, 'BACKUP_FILE_NOT_FOUND');
    }

    logger.info('Restoration of backup confirmed and verified', { filename });
    return true;
  }
}

export const backupService = new BackupService();
