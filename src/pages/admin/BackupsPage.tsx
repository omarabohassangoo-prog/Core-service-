import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export const BackupsPage: React.FC = () => {
  const { showToast } = useToast();
  const [backups, setBackups] = useState<Array<{ filename: string; sizeBytes: number; createdAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Restore Modal
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listBackups();
      if (res.data) setBackups(res.data);
    } catch {
      showToast('فشل تحميل قائمة النسخ الاحتياطية', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const res = await adminApi.createBackup();
      showToast(res.message || 'تم إنشاء النسخة الاحتياطية بنجاح!', 'success');
      fetchBackups();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل إنشاء النسخة الاحتياطية', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenRestore = (filename: string) => {
    setSelectedBackup(filename);
    setConfirmCode('');
    setIsRestoreModalOpen(true);
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmCode !== 'RESTORE_CONFIRMED') {
      showToast('يجب كتابة RESTORE_CONFIRMED لتأكيد الاسترجاع', 'error');
      return;
    }

    if (!selectedBackup) return;

    setIsRestoring(true);
    try {
      const res = await adminApi.restoreBackup(selectedBackup, confirmCode);
      showToast(res.message || 'تم استرجاع النسخة الاحتياطية بنجاح!', 'success');
      setIsRestoreModalOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشلت عملية الاسترجاع', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>إدارة النسخ الاحتياطي للنظام (System Backups)</h2>
          <p className="text-muted">تصدير لقطات كاملة لقواعد البيانات والإعدادات مع آلية استرجاع موثوقة</p>
        </div>
        <Button variant="primary" isLoading={isCreating} onClick={handleCreateBackup}>
          💾 إنشاء نسخة احتياطية جديدة الآن
        </Button>
      </div>

      <div className="data-table-container">
        {isLoading ? (
          <div className="page-loader">
            <div className="spinner-large" />
          </div>
        ) : backups.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم ملف النسخة</th>
                <th>الحجم</th>
                <th>تاريخ الإنشاء</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.filename}>
                  <td><code>{b.filename}</code></td>
                  <td>{(b.sizeBytes / 1024).toFixed(2)} KB</td>
                  <td>{new Date(b.createdAt).toLocaleString('ar-EG')}</td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRestore(b.filename)}
                    >
                      استرجاع هذه النسخة
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>لا توجد نسخ احتياطية سابقة. اضغط على الزر أعلاه لإنشاء أول لقطة.</p>
          </div>
        )}
      </div>

      {/* Restore Modal [13.7] */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="تأكيد استرجاع النسخة الاحتياطية"
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsRestoreModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="danger"
              disabled={confirmCode !== 'RESTORE_CONFIRMED'}
              isLoading={isRestoring}
              onClick={handleRestore}
            >
              تنفيذ الاسترجاع المزدوج
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRestore} className="modal-form">
          <p>
            أنت على وشك استرجاع البيانات من الملف: <strong>{selectedBackup}</strong>.
          </p>
          <p className="text-warning">
            لتأكيد هذا الإجراء الحساس، اكتب <strong>RESTORE_CONFIRMED</strong> في الحقل التالي:
          </p>
          <Input
            label="رمز التأكيد المزدوج"
            required
            placeholder="RESTORE_CONFIRMED"
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
