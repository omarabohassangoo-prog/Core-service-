import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { SystemHealthData } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const SystemHealthPage: React.FC = () => {
  const { showToast } = useToast();
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Factory Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchHealth = () => {
    setIsLoading(true);
    adminApi
      .getHealth()
      .then((res) => {
        if (res.data) setHealth(res.data);
      })
      .catch(() => showToast('فشل جلب بيانات صحة النظام', 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleFactoryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmText !== 'RESET') {
      showToast('يجب كتابة كلمة RESET حرفياً للتأكيد', 'error');
      return;
    }

    setIsResetting(true);
    try {
      const res = await adminApi.factoryReset(resetConfirmText);
      showToast(res.message || 'تمت إعادة ضبط المصنع بنجاح', 'success');
      setIsResetModalOpen(false);
      setResetConfirmText('');
      fetchHealth();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشلت عملية إعادة الضبط', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>صحة وحالة النظام (System Health)</h2>
          <p className="text-muted">مراقبة حية للأداء، استهلاك الموارد، والتحكم بإعادة ضبط المصنع</p>
        </div>
        <div className="title-actions">
          <Button variant="outline" onClick={fetchHealth} isLoading={isLoading}>
            تحديث المؤشرات الآن
          </Button>
          <Button variant="danger" onClick={() => setIsResetModalOpen(true)}>
            ⚠️ إعادة ضبط المصنع (Factory Reset)
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="page-loader">
          <div className="spinner-large" />
        </div>
      ) : health ? (
        <div className="health-grid">
          {/* Status Box */}
          <div className="health-card">
            <div className="health-card-header">
              <span className="h-icon">🩺</span>
              <h3>الاستجابة والجاهزية (Live & Ready)</h3>
            </div>
            <div className="health-metrics">
              <div className="metric-row">
                <span>حالة الخادم:</span>
                <Badge variant="success">{health.status}</Badge>
              </div>
              <div className="metric-row">
                <span>وقت التشغيل المتواصل:</span>
                <strong>{health.uptime.formatted}</strong>
              </div>
              <div className="metric-row">
                <span>نقاط فحص السلامة:</span>
                <code>/api/health/live &amp; /api/health/ready</code>
              </div>
            </div>
          </div>

          {/* Database Box */}
          <div className="health-card">
            <div className="health-card-header">
              <span className="h-icon">🗄️</span>
              <h3>قاعدة البيانات (Database Health)</h3>
            </div>
            <div className="health-metrics">
              <div className="metric-row">
                <span>الاتصال:</span>
                <Badge variant="success">{health.database.status}</Badge>
              </div>
              <div className="metric-row">
                <span>زمن الاستجابة (Latency):</span>
                <strong>{health.database.latencyMs} ms</strong>
              </div>
              <div className="metric-row">
                <span>محرك البيانات:</span>
                <span>Prisma ORM (Strict Pool)</span>
              </div>
            </div>
          </div>

          {/* Memory Box */}
          <div className="health-card">
            <div className="health-card-header">
              <span className="h-icon">🧠</span>
              <h3>استهلاك الذاكرة (Memory Usage)</h3>
            </div>
            <div className="health-metrics">
              <div className="metric-row">
                <span>ذاكرة الـ Heap المستخدمة:</span>
                <strong>{health.memory.heapUsedMb} MB</strong>
              </div>
              <div className="metric-row">
                <span>إجمالي الـ Heap المخصص:</span>
                <span>{health.memory.heapTotalMb} MB</span>
              </div>
              <div className="metric-row">
                <span>ذاكرة النظام الكلية (RSS):</span>
                <span>{health.memory.rssMb} MB</span>
              </div>
            </div>
          </div>

          {/* Statistics Box */}
          <div className="health-card">
            <div className="health-card-header">
              <span className="h-icon">📊</span>
              <h3>إحصائيات الكيانات المخزنة</h3>
            </div>
            <div className="health-metrics">
              <div className="metric-row">
                <span>المستخدمون:</span>
                <span>{health.statistics.totalUsers} (نشط: {health.statistics.activeUsers})</span>
              </div>
              <div className="metric-row">
                <span>الصفحات المنشورة:</span>
                <span>{health.statistics.totalPages}</span>
              </div>
              <div className="metric-row">
                <span>رسائل الاستفسار:</span>
                <span>{health.statistics.totalMessages}</span>
              </div>
              <div className="metric-row">
                <span>سجلات التدقيق:</span>
                <span>{health.statistics.auditLogsCount}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Factory Reset Modal [7.14] */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="⚠️ تأكيد إعادة ضبط المصنع (Factory Reset)"
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsResetModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              disabled={resetConfirmText !== 'RESET'}
              isLoading={isResetting}
              onClick={handleFactoryReset}
            >
              تنفيذ إعادة الضبط الشاملة
            </Button>
          </div>
        }
      >
        <div className="factory-reset-warning">
          <p className="text-danger font-bold">
            تحذير فائق الأهمية:
          </p>
          <p>
            سيتم حذف كافة المستخدمين التجريبيين، التوكنات، وسجلات التواصل غير المرتبطة بالمدير الأعلى الحالي.
            لحماية النظام، سيتم الحفاظ الصارم على حسابك كـ Super Admin دون حذفه.
          </p>
          <p>
            لتأكيد هذا الإجراء، يرجى كتابة كلمة <strong>RESET</strong> بالأحرف الإنجليزية الكبيرة في الحقل أدناه:
          </p>

          <Input
            label="رمز التأكيد الصريح"
            placeholder="اكتب RESET"
            required
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
