import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../utils/appError';

export class UserController {
  private parseNumericId(rawId: string, entityName: string): number {
    const id = parseInt(rawId, 10);
    if (isNaN(id) || id <= 0) {
      throw new AppError(`معرف ${entityName} غير صالح`, 400, 'INVALID_ID');
    }
    return id;
  }

  public async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const profile = await userService.getProfile(userId);
    res.status(200).json({
      success: true,
      data: profile,
    });
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const updated = await userService.updateProfile(userId, req.body);
    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات الملف الشخصي بنجاح',
      data: updated,
    });
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const result = await userService.changePassword(userId, req.body);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { page, limit } = req.query;
    const result = await userService.getNotifications(
      userId,
      typeof page === 'string' ? page : undefined,
      typeof limit === 'string' ? limit : undefined
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  }

  public async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const notificationId = this.parseNumericId(req.params.id, 'الإشعار');
    const result = await userService.markNotificationAsRead(userId, notificationId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async getDashboardSummary(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const summary = await userService.getUserDashboardSummary(userId);
    res.status(200).json({
      success: true,
      data: summary,
    });
  }
}

export const userController = new UserController();
