import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate';
import { requirePermission } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createUserSchema,
  updateUserSchema,
  createRoleSchema,
  updateRoleSchema,
  updateSettingSchema,
  testServiceSchema,
  createPageSchema,
  updatePageSchema,
  factoryResetSchema,
} from '../schemas/admin.schema';

const router = Router();

// Protect ALL admin routes with authentication [6.3]
router.use(authenticate);

// ================= Dashboard KPIs, Charts & Alerts (A.2) =================
router.get(
  '/dashboard/kpis',
  requirePermission('system.health'),
  asyncHandler(adminController.getDashboardKPIs.bind(adminController))
);

router.get(
  '/dashboard/charts',
  requirePermission('system.health'),
  asyncHandler(adminController.getDashboardCharts.bind(adminController))
);

router.get(
  '/dashboard/smart-alerts',
  requirePermission('system.health'),
  asyncHandler(adminController.getSmartAlerts.bind(adminController))
);

// ================= Global Search (Ctrl+K) =================
router.get(
  '/search',
  asyncHandler(adminController.globalSearch.bind(adminController))
);

// ================= Users Management (A.3) =================
router.get(
  '/users',
  requirePermission('users.read'),
  asyncHandler(adminController.listUsers.bind(adminController))
);

router.get(
  '/users/export',
  requirePermission('users.export'),
  asyncHandler(adminController.exportUsers.bind(adminController))
);

router.post(
  '/users/bulk-action',
  requirePermission('users.update'),
  asyncHandler(adminController.bulkUserAction.bind(adminController))
);

router.post(
  '/users/:id/impersonate',
  requirePermission('users.impersonate'),
  asyncHandler(adminController.impersonateUser.bind(adminController))
);

router.post(
  '/users/:id/unlock',
  requirePermission('users.update'),
  asyncHandler(adminController.unlockUser.bind(adminController))
);

router.post(
  '/users/:id/change-password',
  requirePermission('users.update'),
  asyncHandler(adminController.adminChangePassword.bind(adminController))
);

router.get(
  '/users/:id',
  requirePermission('users.read'),
  asyncHandler(adminController.getUser.bind(adminController))
);

router.post(
  '/users',
  requirePermission('users.create'),
  validate(createUserSchema, 'body'),
  asyncHandler(adminController.createUser.bind(adminController))
);

router.put(
  '/users/:id',
  requirePermission('users.update'),
  validate(updateUserSchema, 'body'),
  asyncHandler(adminController.updateUser.bind(adminController))
);

router.delete(
  '/users/:id',
  requirePermission('users.delete'),
  asyncHandler(adminController.deleteUser.bind(adminController))
);

// ================= Templates & Notifications (A.7 & A.8) =================
router.get(
  '/templates',
  requirePermission('templates.read'),
  asyncHandler(adminController.listTemplates.bind(adminController))
);

router.get(
  '/templates/:key',
  requirePermission('templates.read'),
  asyncHandler(adminController.getTemplate.bind(adminController))
);

router.put(
  '/templates/:key',
  requirePermission('templates.write'),
  asyncHandler(adminController.updateTemplate.bind(adminController))
);

router.post(
  '/notifications/send',
  requirePermission('notifications.send'),
  asyncHandler(adminController.sendNotification.bind(adminController))
);

// ================= System Sessions & Cache (A.13) =================
router.get(
  '/sessions',
  requirePermission('system.manage'),
  asyncHandler(adminController.listSessions.bind(adminController))
);

router.delete(
  '/sessions/:id',
  requirePermission('system.manage'),
  asyncHandler(adminController.terminateSession.bind(adminController))
);

router.delete(
  '/sessions/user/:userId',
  requirePermission('system.manage'),
  asyncHandler(adminController.terminateAllUserSessions.bind(adminController))
);

router.post(
  '/system/cache/clear',
  requirePermission('system.manage'),
  asyncHandler(adminController.clearCache.bind(adminController))
);

router.post(
  '/system/maintenance',
  requirePermission('system.manage'),
  asyncHandler(adminController.toggleMaintenance.bind(adminController))
);

router.post(
  '/audit-logs/clear',
  requirePermission('system.manage'),
  asyncHandler(adminController.clearAuditLogs.bind(adminController))
);

// ================= Roles & Permissions =================
router.get(
  '/roles',
  requirePermission('roles.manage'),
  asyncHandler(adminController.listRoles.bind(adminController))
);

router.get(
  '/permissions',
  requirePermission('roles.manage'),
  asyncHandler(adminController.listPermissions.bind(adminController))
);

router.post(
  '/roles',
  requirePermission('roles.manage'),
  validate(createRoleSchema, 'body'),
  asyncHandler(adminController.createRole.bind(adminController))
);

router.put(
  '/roles/:id',
  requirePermission('roles.manage'),
  validate(updateRoleSchema, 'body'),
  asyncHandler(adminController.updateRole.bind(adminController))
);

// ================= System Settings (12 Groups) =================
router.get(
  '/settings',
  requirePermission('settings.read'),
  asyncHandler(adminController.listSettings.bind(adminController))
);

router.put(
  '/settings/:key',
  requirePermission('settings.update'),
  validate(updateSettingSchema, 'body'),
  asyncHandler(adminController.updateSetting.bind(adminController))
);

router.post(
  '/services/test',
  requirePermission('services.test'),
  validate(testServiceSchema, 'body'),
  asyncHandler(adminController.testService.bind(adminController))
);

// ================= CMS Pages =================
router.get(
  '/pages',
  requirePermission('pages.manage'),
  asyncHandler(adminController.listPages.bind(adminController))
);

router.post(
  '/pages',
  requirePermission('pages.manage'),
  validate(createPageSchema, 'body'),
  asyncHandler(adminController.createPage.bind(adminController))
);

router.put(
  '/pages/:id',
  requirePermission('pages.manage'),
  validate(updatePageSchema, 'body'),
  asyncHandler(adminController.updatePage.bind(adminController))
);

router.delete(
  '/pages/:id',
  requirePermission('pages.manage'),
  asyncHandler(adminController.deletePage.bind(adminController))
);

// ================= Audit Logs =================
router.get(
  '/audit-logs',
  requirePermission('audit.read'),
  asyncHandler(adminController.listAuditLogs.bind(adminController))
);

// ================= System Health =================
router.get(
  '/health',
  requirePermission('settings.read'),
  asyncHandler(adminController.getHealth.bind(adminController))
);

// ================= Backups =================
router.get(
  '/backups',
  requirePermission('settings.read'),
  asyncHandler(adminController.listBackups.bind(adminController))
);

router.post(
  '/backups',
  requirePermission('settings.update'),
  asyncHandler(adminController.createBackup.bind(adminController))
);

router.post(
  '/backups/restore',
  requirePermission('settings.update'),
  asyncHandler(adminController.restoreBackup.bind(adminController))
);

// ================= Factory Reset =================
router.post(
  '/system/reset',
  requirePermission('system.reset'),
  validate(factoryResetSchema, 'body'),
  asyncHandler(adminController.factoryReset.bind(adminController))
);

export default router;
