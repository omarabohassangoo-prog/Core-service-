import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { AuditLogItem, PaginatedResult } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';

export const AuditLogsPage: React.FC = () => {
  const { showToast } = useToast();
  const [logsData, setLogsData] = useState<PaginatedResult<AuditLogItem> | null>(null);
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listAuditLogs(page, 20, moduleFilter || undefined);
      if (res.data) setLogsData(res.data);
    } catch {
      showToast('فشل تحميل سجلات التدقيق', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, moduleFilter, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>سجلات التدقيق الأمني (Audit Logs)</h2>
          <p className="text-muted">توثيق شامل وغير قابل للتعديل لجميع العمليات الإدارية وتغييرات النظام</p>
        </div>
        <div className="filter-group">
          <select
            className="form-input form-select"
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">جميع الوحدات</option>
            <option value="auth">المصادقة (auth)</option>
            <option value="users">المستخدمين (users)</option>
            <option value="roles">الأدوار (roles)</option>
            <option value="settings">الإعدادات (settings)</option>
            <option value="pages">الصفحات (pages)</option>
            <option value="system">النظام (system)</option>
          </select>
        </div>
      </div>

      <div className="data-table-container">
        {isLoading ? (
          <div className="page-loader">
            <div className="spinner-large" />
          </div>
        ) : logsData && logsData.items.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>المعرف</th>
                  <th>العملية / الإجراء</th>
                  <th>الوحدة (Module)</th>
                  <th>المنفذ (User)</th>
                  <th>عنوان IP</th>
                  <th>التفاصيل الموثقة</th>
                  <th>الوقت والتاريخ</th>
                </tr>
              </thead>
              <tbody>
                {logsData.items.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td><code className="action-tag">{log.action}</code></td>
                    <td><span className="badge badge-neutral">{log.module}</span></td>
                    <td>
                      {log.user ? (
                        <span>{log.user.firstName} {log.user.lastName} ({log.user.email})</span>
                      ) : (
                        <span className="text-muted">نظام آلي</span>
                      )}
                    </td>
                    <td><small>{log.ipAddress || 'غير محدد'}</small></td>
                    <td>
                      <small className="log-details-text">
                        {log.details || '—'}
                      </small>
                    </td>
                    <td>{new Date(log.createdAt).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination-bar">
              <span className="pagination-info">
                إجمالي {logsData.meta.total} عملية — صفحة {logsData.meta.page} من {logsData.meta.totalPages}
              </span>
              <div className="pagination-buttons">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!logsData.meta.hasPrevPage}
                  onClick={() => setPage(page - 1)}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!logsData.meta.hasNextPage}
                  onClick={() => setPage(page + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>لا توجد سجلات تدقيق مسجلة حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
};
