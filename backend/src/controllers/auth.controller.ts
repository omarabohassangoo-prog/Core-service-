import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  public async login(req: Request, res: Response): Promise<void> {
    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.login(req.body, metadata);
    res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: result,
    });
  }

  public async register(req: Request, res: Response): Promise<void> {
    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await authService.register(req.body, metadata);
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: result,
    });
  }

  public async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    res.status(200).json({
      success: true,
      data: tokens,
    });
  }

  public async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });
  }

  public async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.debugToken ? { debugToken: result.debugToken } : undefined,
    });
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body);
    res.status(200).json({
      success: true,
      message: 'تمت إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
    });
  }

  public async me(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const user = await authService.getCurrentUser(userId);
    res.status(200).json({
      success: true,
      data: user,
    });
  }
}

export const authController = new AuthController();
