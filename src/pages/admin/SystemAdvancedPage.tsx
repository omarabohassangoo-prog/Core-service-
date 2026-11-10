import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

interface SessionItem {
  id: number;
  userId: number;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

export const SystemAdvancedPage: React.FC = () => {
  const { showToast } = useToast();

  // Maintenance state
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('النظام يخضع حالياً لأعمال صيانة دورية مجدولة.');
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Cache clearing state
  const [isClearingMemory, setIsClearingMemory] = useState(false);
  const [isClearingSettings, setIsClearingSettings] = useState(false);

  // Clear Audit Logs Modal
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditConfirmCode, setAuditConfirmCode] = useState('');
  const [isClearingAudit, setIsClearingAudit] = useState(false);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await adminApi.listSessions();
      if (res.data) setSessions(res.data);
    } catch {
      showToast('تعذر تحميل الجلسات النشطة', 'error');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Toggle Maintenance Mode
  const handleToggleMaintenance = async () => {
    setIsUpdatingMaintenance(true);
    try {
      const targetState = !isMaintenance;
      const res = await adminApi.toggleMaintenance(targetState, maintenanceMsg);
      setIsMaintenance(targetState);
      showToast(res.message || 'تم تحديث وضع الصيانة بنجاح', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل تحديث وضع الصيانة', 'error');
    } finally {
      setIsUpdatingMaintenance(false);
    }
  };

  // Clear Cache
  const handleClearCache = async (type: 'memory' | 'settings') => {
    if (type === 'memory') setIsClearingMemory(true);
    if (type === 'settings') setIsClearingSettings(true);

    try {
      const res = await adminApi.clearCache(type);
      showToast(res.message || `تم تفريغ كاش (${type}) بنجاح`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل تفريغ الكاش', 'error');
    } finally {
      if (type === 'memory') setIsClearingMemory(false);
      if (type === 'settings') setIsClearingSettings(false);
    }
  };

  // Terminate Single Session
  const handleTerminateSession = async (id: number) => {
    if (!confirm(`هل أنت متأكد من رغبتك في إلغاء وتفكيك الجلسة #${id}؟`)) return;

    try {
      const res = await adminApi.terminateSession(id);
      showToast(res.message || 'تم إنهاء الجلسة بنجاح', 'success');
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل إنهاء الجلسة', 'error');
    }
  };

  // Terminate All User Sessions
  const handleTerminateAllUserSessions = async (userId: number, email: string) => {
    if (!confirm(`هل ترغب في إنهاء كافة الجلسات النشطة للمستخدم (${email})؟`)) return;

    try {
      const res = await adminApi.terminateAllUserSessions(userId);
      showToast(res.message || `تم إنهاء جميع جلسات (${email})`, 'success');
      setSessions((prev) => prev.filter((s) => s.userId !== userId));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل إنهاء جلسات المستخدم', 'error');
    }
  };

  // Clear Audit Logs with CLEAR verification
  const handlePurgeAuditLogs = async () => {
    if (auditConfirmCode !== 'CLEAR') {
      showToast('يجب كتابة كلمة CLEAR بالإنجليزية لتأكيد الحذف', 'error');
      return;
    }

    setIsClearingAudit(true);
    try {
      const res = await adminApi.clearAuditLogs(auditConfirmCode);
      showToast(res.message || 'تم تصفير سجلات التدقيق بنجاح', 'success');
      setIsAuditModalOpen(false);
      setAuditConfirmCode('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل تصفير سجلات التدقيق', 'error');
    } finally {
      setIsClearingAudit(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>إدارة النظام والجلسات المتقدمة (Appendix A.13)</h2>
          <p className="text-muted">التحكم بوضع الصيانة، تفريغ الكاش الميموري، تفكيك الجلسات النشطة، وتطهير السجلات</p>
        </div>
      </div>

      <div className="dashboard-columns">
        {/* Maintenance Mode Card */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div>
              <h3>وضع الصيانة المباشر (Maintenance Mode)</h3>
              <p className="card-subtitle">إغلاق المنصة مؤقتاً في وجه الزوار والسماح للمدراء فقط</p>
            </div>
            <Badge variant={isMaintenance ? 'danger' : 'success'}>
              {isMaintenance ? '🔴 وضع الصيانة مفعل' : '🟢 المنظومة تعمل بشكل طبيعي'}
            </Badge>
          </div>

          <div className="maintenance-box mt-3">
            <div className="form-group mb-3">
              <label className="form-label">رسالة التنبيه المعروضة للمستخدمين:</label>
              <textarea
                rows={3}
                className="form-input"
                value={maintenanceMsg}
                onChange={(e) => setMaintenanceMsg(e.target.value)}
                placeholder="اكتب رسالة الصيانة والمدة المتوقعة..."
              />
            </div>

            <Button
              variant={isMaintenance ? 'primary' : 'outline'}
              className={isMaintenance ? 'btn-success' : 'btn-danger'}
              onClick={handleToggleMaintenance}
              isLoading={isUpdatingMaintenance}
            >
              {isMaintenance ? '✓ إلغاء وضع الصيانة وإعادة المنظومة للعمل' : '⚠️ تفعيل وضع الصيانة للجميع الآن'}
            </Button>
          </div>
        </div>

        {/* Cache Management Card */}
        <div className="dashboard-card">
          <h3>إدارة الذاكرة المؤقتة (Cache Management)</h3>
          <p className="card-subtitle mb-3">تفريغ الكاش لضمان مزامنة التغييرات الفورية</p>

          <div className="cache-actions-list">
            <div className="cache-item">
              <div>
                <strong>تفريغ كاش الذاكرة التشغيلية (In-Memory Runtime Cache)</strong>
                <p className="text-muted text-sm">يقوم بمسح معدلات الطلبات المؤقتة، إحصائيات المعالجة السريعة، وبيانات الجلسات المؤقتة.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearCache('memory')}
                isLoading={isClearingMemory}
              >
                🧹 تفريغ كاش الذاكرة
              </Button>
            </div>

            <div className="cache-item mt-3">
              <div>
                <strong>تفريغ كاش إعدادات المنظومة (Settings & Secrets Cache)</strong>
                <p className="text-muted text-sm">يجبر الخادم على إعادة قراءة وفك تشفير الـ 12 مجموعة إعدادات من قاعدة البيانات مباشرة.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClearCache('settings')}
                isLoading={isClearingSettings}
              >
                🔄 إعادة تحميل الإعدادات
              </Button>
            </div>
          </div>

          <div className="danger-zone-box mt-4">
            <h4>المنطقة الأمنية الحساسة:</h4>
            <div className="danger-action-flex">
              <div>
                <strong>تطهير سجلات التدقيق (Purge Audit Logs)</strong>
                <p className="text-muted text-sm">أرشفة وحذف كافة سجلات التدقيق الأمني القديمة نهائياً.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => setIsAuditModalOpen(true)}
              >
                تطهير السجلات...
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions Management Table */}
      <div className="dashboard-card mt-4">
        <div className="card-header-flex">
          <div>
            <h3>إدارة الجلسات ورموز التحديث النشطة (Active Refresh Tokens)</h3>
            <p className="card-subtitle">كافة جلسات تسجيل الدخول الموثقة في المنظومة مع إمكانية الإنهاء الفوري</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            🔄 تحديث الجلسات
          </Button>
        </div>

        <div className="data-table-container mt-3">
          {isLoadingSessions ? (
            <div className="page-loader">
              <div className="spinner-large" />
            </div>
          ) : sessions.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>معرف الجلسة</th>
                  <th>المستخدم صاحب الجلسة</th>
                  <th>تجزئة التوكن (Hashed Token)</th>
                  <th>تاريخ الإنشاء</th>
                  <th>تاريخ انتهاء الصلاحية</th>
                  <th>إجراء الإلغاء</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td><code>#{s.id}</code></td>
                    <td>
                      <div>
                        <strong>{s.user.firstName} {s.user.lastName}</strong>
                        <div className="text-muted text-xs">{s.user.email}</div>
                      </div>
                    </td>
                    <td>
                      <code className="text-xs text-muted">
                        {s.tokenHash ? `${s.tokenHash.slice(0, 16)}...` : 'N/A'}
                      </code>
                    </td>
                    <td>{new Date(s.createdAt).toLocaleString('ar-EG')}</td>
                    <td>
                      <span className="text-xs">
                        {new Date(s.expiresAt).toLocaleDateString('ar-EG')}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger"
                          onClick={() => handleTerminateSession(s.id)}
                          title="إنهاء هذه الجلسة فقط"
                        >
                          إنهاء الجلسة
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTerminateAllUserSessions(s.userId, s.user.email)}
                          title="إنهاء كافة جلسات هذا المستخدم"
                        >
                          إنهاء للكل
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>لا توجد جلسات تحديث نشطة حالياً.</p>
            </div>
          )}
        </div>
      </div>

      {/* Clear Audit Logs Modal */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="تأكيد تطهير سجلات التدقيق الأمني"
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsAuditModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              className="btn-danger"
              onClick={handlePurgeAuditLogs}
              isLoading={isClearingAudit}
              disabled={auditConfirmCode !== 'CLEAR'}
            >
              تأكيد التطهير النهائي
            </Button>
          </div>
        }
      >
        <div className="modal-form">
          <p className="text-danger mb-3">
            ⚠️ <strong>تحذير أمني شديد:</strong> هذا الإجراء سيقوم بحذف سجلات التدقيق (Audit Logs) بالكامل. لتأكيد الإجراء، اكتب كلمة <code>CLEAR</code> بالإنجليزية في الحقل أدناه:
          </p>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="اكتب CLEAR للتأكيد"
              value={auditConfirmCode}
              onChange={(e) => setAuditConfirmCode(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
