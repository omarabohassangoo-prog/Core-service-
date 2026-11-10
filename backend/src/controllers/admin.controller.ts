import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { backupService } from '../services/external/backup.service';
import { AppError } from '../utils/appError';

export class AdminController {
  private parseNumericId(rawId: string, entityName: string): number {
    const id = parseInt(rawId, 10);
    if (isNaN(id) || id <= 0) {
      throw new AppError(`معرف ${entityName} غير صالح`, 400, 'INVALID_ID');
    }
    return id;
  }

  // Users
  public async listUsers(req: Request, res: Response): Promise<void> {
    const result = await adminService.listUsers(req.query as any);
    res.status(200).json({
      success: true,
      data: result,
    });
  }

  public async getUser(req: Request, res: Response): Promise<void> {
    const id = this.parseNumericId(req.params.id, 'المستخدم');
    const user = await adminService.getUserById(id);
    res.status(200).json({
      success: true,
      data: user,
    });
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    const user = await adminService.createUser(req.body, actorId);
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: user,
    });
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    const id = this.parseNumericId(req.params.id, 'المستخدم');
    const actorId = req.user?.id;
    const user = await adminService.updateUser(id, req.body, actorId);
    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات المستخدم بنجاح',
      data: user,
    });
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    const id = this.parseNumericId(req.params.id, 'المستخدم');
    const actorId = req.user?.id;
    const result = await adminService.deleteUser(id, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  // Roles & Permissions
  public async listRoles(_req: Request, res: Response): Promise<void> {
    const roles = await adminService.listRoles();
    res.status(200).json({
      success: true,
      data: roles,
    });
  }

  public async listPermissions(_req: Request, res: Response): Promise<void> {
    const permissions = await adminService.listPermissions();
    res.status(200).json({
      success: true,
      data: permissions,
    });
  }

  public async createRole(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    const role = await adminService.createRole(req.body, actorId);
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الدور بنجاح',
      data: role,
    });
  }

  public async updateRole(req: Request, res: Response): Promise<void> {
    const id = this.parseNumericId(req.params.id, 'الدور');
    const actorId = req.user?.id;
    const role = await adminService.updateRole(id, req.body, actorId);
    res.status(200).json({
      success: true,
      message: 'تم تعديل الدور وصلاحياته بنجاح',
      data: role,
    });
  }

  // Settings
  public async listSettings(req: Request, res: Response): Promise<void> {
    const group = typeof req.query.group === 'string' ? req.query.group : undefined;
    const settings = await adminService.getSettingsByGroup(group);
    res.status(200).json({
      success: true,
      data: settings,
    });
  }

  public async updateSetting(req: Request, res: Response): Promise<void> {
    const key = req.params.key;
    const actorId = req.user?.id;
    const setting = await adminService.updateSetting(key, req.body.value, actorId);
    res.status(200).json({
      success: true,
      message: 'تم حفظ الإعداد بنجاح',
      data: setting,
    });
  }

  public async testService(req: Request, res: Response): Promise<void> {
    const { serviceType } = req.body;
    const result = await adminService.testServiceConnection(serviceType);
    res.status(200).json({
      success: true,
      data: result,
    });
  }

  // Pages
  public async listPages(_req: Request, res: Response): Promise<void> {
    const pages = await adminService.listPages();
    res.status(200).json({
      success: true,
      data: pages,
    });
  }

  public async createPage(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    const page = await adminService.createPage(req.body, actorId);
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الصفحة بنجاح',
      data: page,
    });
  }

  public async updatePage(req: Request, res: Response): Promise<void> {
    const id = this.parseNumericId(req.params.id, 'الصفحة');
    const actorId = req.user?.id;
    const page = await adminService.updatePage(id, req.body, actorId);
    res.status(200).json({
      success: true,
      message: 'تم تحديث الصفحة بنجاح',
      data: page,
    });
  }

  public async deletePage(req: Request, res: Response): Promise<void> {
    const id = this.parseNumericId(req.params.id, 'الصفحة');
    const actorId = req.user?.id;
    const result = await adminService.deletePage(id, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  // Audit Logs
  public async listAuditLogs(req: Request, res: Response): Promise<void> {
    const { page, limit, module } = req.query;
    const result = await adminService.listAuditLogs(
      typeof page === 'string' ? page : undefined,
      typeof limit === 'string' ? limit : undefined,
      typeof module === 'string' ? module : undefined
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  }

  // Health
  public async getHealth(_req: Request, res: Response): Promise<void> {
    const health = await adminService.getSystemHealth();
    res.status(200).json({
      success: true,
      data: health,
    });
  }

  // Backup
  public async createBackup(_req: Request, res: Response): Promise<void> {
    const backup = await backupService.createBackup();
    res.status(201).json({
      success: true,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح',
      data: backup,
    });
  }

  public async listBackups(_req: Request, res: Response): Promise<void> {
    const backups = await backupService.listBackups();
    res.status(200).json({
      success: true,
      data: backups,
    });
  }

  public async restoreBackup(req: Request, res: Response): Promise<void> {
    const { filename, confirmCode } = req.body;
    await backupService.restoreBackup(filename, confirmCode);
    res.status(200).json({
      success: true,
      message: 'تم استرجاع النسخة الاحتياطية بنجاح',
    });
  }

  // Factory Reset
  public async factoryReset(req: Request, res: Response): Promise<void> {
    const { confirmText } = req.body;
    const currentAdminId = req.user!.id;
    const result = await adminService.factoryReset(confirmText, currentAdminId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  // ================= APPENDIX A: CONTROLLER METHODS =================
  public async bulkUserAction(req: Request, res: Response): Promise<void> {
    const { action, userIds, extraValue } = req.body;
    const actorId = req.user?.id;
    const result = await adminService.bulkUserAction(action, userIds, extraValue, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async impersonateUser(req: Request, res: Response): Promise<void> {
    const targetUserId = this.parseNumericId(req.params.id, 'المستخدم');
    const actorId = req.user!.id;
    const result = await adminService.impersonateUser(targetUserId, actorId);
    res.status(200).json({
      success: true,
      message: 'تم انتحال الهوية بنجاح',
      data: result,
    });
  }

  public async unlockUser(req: Request, res: Response): Promise<void> {
    const userId = this.parseNumericId(req.params.id, 'المستخدم');
    const actorId = req.user?.id;
    const result = await adminService.unlockUser(userId, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async adminChangePassword(req: Request, res: Response): Promise<void> {
    const userId = this.parseNumericId(req.params.id, 'المستخدم');
    const { password } = req.body;
    const actorId = req.user?.id;
    const result = await adminService.adminChangePassword(userId, password, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async exportUsers(req: Request, res: Response): Promise<void> {
    const csvData = await adminService.exportUsersCSV(req.query as any);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.status(200).send(csvData);
  }

  public async getDashboardKPIs(_req: Request, res: Response): Promise<void> {
    const kpis = await adminService.getDashboardKPIs();
    res.status(200).json({
      success: true,
      data: kpis,
    });
  }

  public async getDashboardCharts(_req: Request, res: Response): Promise<void> {
    const charts = await adminService.getDashboardCharts();
    res.status(200).json({
      success: true,
      data: charts,
    });
  }

  public async getSmartAlerts(_req: Request, res: Response): Promise<void> {
    const alerts = await adminService.getSmartAlerts();
    res.status(200).json({
      success: true,
      data: alerts,
    });
  }

  public async listTemplates(req: Request, res: Response): Promise<void> {
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const templates = await adminService.listTemplates(type);
    res.status(200).json({
      success: true,
      data: templates,
    });
  }

  public async getTemplate(req: Request, res: Response): Promise<void> {
    const key = req.params.key;
    const template = await adminService.getTemplateByKey(key);
    res.status(200).json({
      success: true,
      data: template,
    });
  }

  public async updateTemplate(req: Request, res: Response): Promise<void> {
    const key = req.params.key;
    const actorId = req.user?.id;
    const updated = await adminService.updateTemplate(key, req.body, actorId);
    res.status(200).json({
      success: true,
      message: 'تم تحديث القالب بنجاح',
      data: updated,
    });
  }

  public async sendNotification(req: Request, res: Response): Promise<void> {
    const actorId = req.user?.id;
    const result = await adminService.sendAdminNotification(req.body, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async listSessions(_req: Request, res: Response): Promise<void> {
    const sessions = await adminService.listActiveSessions();
    res.status(200).json({
      success: true,
      data: sessions,
    });
  }

  public async terminateSession(req: Request, res: Response): Promise<void> {
    const id = this.parseNumericId(req.params.id, 'الجلسة');
    const actorId = req.user?.id;
    const result = await adminService.terminateSession(id, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async terminateAllUserSessions(req: Request, res: Response): Promise<void> {
    const userId = this.parseNumericId(req.params.userId, 'المستخدم');
    const actorId = req.user?.id;
    const result = await adminService.terminateAllUserSessions(userId, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async clearCache(req: Request, res: Response): Promise<void> {
    const type = req.body.type || 'memory';
    const actorId = req.user?.id;
    const result = await adminService.clearCache(type, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async toggleMaintenance(req: Request, res: Response): Promise<void> {
    const { enabled, message } = req.body;
    const actorId = req.user?.id;
    const result = await adminService.toggleMaintenance(enabled, message, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async clearAuditLogs(req: Request, res: Response): Promise<void> {
    const { confirmCode } = req.body;
    const actorId = req.user?.id;
    const result = await adminService.clearAuditLogs(confirmCode, actorId);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  public async globalSearch(req: Request, res: Response): Promise<void> {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const results = await adminService.globalSearch(query);
    res.status(200).json({
      success: true,
      data: results,
    });
  }
}

export const adminController = new AdminController();
