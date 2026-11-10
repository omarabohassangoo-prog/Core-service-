import { Request, Response } from 'express';
import { installService } from '../services/install.service';

export class InstallController {
  public async getStatus(_req: Request, res: Response): Promise<void> {
    const status = await installService.getInstallationStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  }

  public async setup(req: Request, res: Response): Promise<void> {
    const result = await installService.setupInitialSystem(req.body);
    res.status(201).json({
      success: true,
      message: result.message,
    });
  }
}

export const installController = new InstallController();
