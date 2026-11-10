import { Request, Response } from 'express';
import { publicService } from '../services/public.service';

export class PublicController {
  public async getPage(req: Request, res: Response): Promise<void> {
    const slug = req.params.slug;
    const page = await publicService.getPageBySlug(slug);
    res.status(200).json({
      success: true,
      data: page,
    });
  }

  public async listPages(_req: Request, res: Response): Promise<void> {
    const pages = await publicService.listPublishedPages();
    res.status(200).json({
      success: true,
      data: pages,
    });
  }

  public async submitContact(req: Request, res: Response): Promise<void> {
    const result = await publicService.submitContactMessage(req.body);
    res.status(201).json({
      success: true,
      message: result.message,
      data: { messageId: result.messageId },
    });
  }

  public async getSettings(_req: Request, res: Response): Promise<void> {
    const settings = await publicService.getPublicSettings();
    res.status(200).json({
      success: true,
      data: settings,
    });
  }
}

export const publicController = new PublicController();
