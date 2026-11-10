import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { RoleItem } from '../../types';

export const NotificationsManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Form State
  const [recipientType, setRecipientType] = useState<'all' | 'role' | 'single'>('all');
  const [roleId, setRoleId] = useState<number>(4);
  const [targetId, setTargetId] = useState<string>('');
  const [channel, setChannel] = useState<'inapp' | 'email' | 'sms' | 'whatsapp'>('inapp');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // Dispatch history state
  const [history, setHistory] = useState<Array<{
    id: number;
    title: string;
    message: string;
    recipientType: string;
    channel: string;
    timestamp: string;
  }>>([
    {
      id: 1,
      title: 'تحديث أمني مجدول لنظام المؤسسة',
      message: 'نحيطكم علماً بأنه سيتم إجراء صيانة روتينية يوم الأحد القادم.',
      recipientType: 'الجميع (All)',
      channel: 'inapp',
      timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString('ar-EG'),
    },
    {
      id: 2,
      title: 'تأكيد تفعيل المصادقة الثنائية',
      message: 'يرجى من جميع المشرفين تفعيل بروتوكول المصادقة الثنائية قبل نهاية الشهر.',
      recipientType: 'المدراء (Admin, Super Admin)',
      channel: 'email',
      timestamp: new Date(Date.now() - 3600000 * 24).toLocaleTimeString('ar-EG'),
    },
  ]);

  useEffect(() => {
    adminApi.listRoles().then((res) => {
      if (res.data) setRoles(res.data);
    });
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('يرجى ملء عنوان ونص الإشعار', 'error');
      return;
    }

    if (recipientType === 'single' && !targetId) {
      showToast('يرجى تحديد معرف المستخدم المستهدف', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await adminApi.sendAdminNotification({
        recipientType,
        targetId: recipientType === 'single' ? Number(targetId) : undefined,
        roleId: recipientType === 'role' ? roleId : undefined,
        channel,
        title,
        message,
      });

      showToast(res.message || 'تم إرسال الإشعار بنجاح لكافة المستلمين المستهدفين', 'success');

      // Add to local history
      const newEntry = {
        id: Date.now(),
        title,
        message,
        recipientType:
          recipientType === 'all'
            ? 'الجميع (All)'
            : recipientType === 'role'
            ? `الدور: ${roles.find((r) => r.id === roleId)?.name || roleId}`
            : `مستخدم #${targetId}`,
        channel,
        timestamp: new Date().toLocaleTimeString('ar-EG'),
      };
      setHistory([newEntry, ...history]);

      // Reset form
      setTitle('');
      setMessage('');
      setTargetId('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل إرسال الإشعار', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>مركز إرسال وبث الإشعارات (Appendix A.8)</h2>
          <p className="text-muted">إرسال التنبيهات الفورية الفردية والجماعية عبر قنوات الإشعار المتعددة</p>
        </div>
      </div>

      <div className="dashboard-columns">
        {/* Send Notification Card */}
        <div className="dashboard-card">
          <h3>إنشاء وبث إشعار جديد</h3>
          <p className="card-subtitle mb-3">اختر الفئة المستهدفة وقناة التسليم</p>

          <form onSubmit={handleSendNotification} className="admin-form">
            {/* Recipient Type */}
            <div className="form-group mb-3">
              <label className="form-label">الجهة المستلمة</label>
              <div className="radio-group-flex">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="recipientType"
                    value="all"
                    checked={recipientType === 'all'}
                    onChange={() => setRecipientType('all')}
                  />
                  <span>الجميع (بث عام)</span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="recipientType"
                    value="role"
                    checked={recipientType === 'role'}
                    onChange={() => setRecipientType('role')}
                  />
                  <span>حسب الدور الوظيفي</span>
                </label>

                <label className="radio-label">
                  <input
                    type="radio"
                    name="recipientType"
                    value="single"
                    checked={recipientType === 'single'}
                    onChange={() => setRecipientType('single')}
                  />
                  <span>مستخدم فردي محدد</span>
                </label>
              </div>
            </div>

            {/* Role select if recipientType === role */}
            {recipientType === 'role' && (
              <div className="form-group mb-3">
                <label className="form-label">اختر الدور المستهدف:</label>
                <select
                  className="form-input form-select"
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.slug})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target User ID if recipientType === single */}
            {recipientType === 'single' && (
              <div className="form-group mb-3">
                <label className="form-label">معرف المستخدم (User ID):</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="مثال: 12"
                  required
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                />
              </div>
            )}

            {/* Channel Selection */}
            <div className="form-group mb-3">
              <label className="form-label">قناة التسليم (Channel):</label>
              <div className="channels-pill-selector">
                <button
                  type="button"
                  className={`channel-pill-btn ${channel === 'inapp' ? 'active' : ''}`}
                  onClick={() => setChannel('inapp')}
                >
                  🔔 داخل المنصة (In-App)
                </button>
                <button
                  type="button"
                  className={`channel-pill-btn ${channel === 'email' ? 'active' : ''}`}
                  onClick={() => setChannel('email')}
                >
                  ✉️ بريد إلكتروني (Email)
                </button>
                <button
                  type="button"
                  className={`channel-pill-btn ${channel === 'sms' ? 'active' : ''}`}
                  onClick={() => setChannel('sms')}
                >
                  💬 رسالة نصية (SMS)
                </button>
                <button
                  type="button"
                  className={`channel-pill-btn ${channel === 'whatsapp' ? 'active' : ''}`}
                  onClick={() => setChannel('whatsapp')}
                >
                  🟢 واتساب (WhatsApp)
                </button>
              </div>
            </div>

            {/* Title */}
            <Input
              label="عنوان الإشعار"
              required
              placeholder="مثال: تنبيه بخصوص تحديث سياسة الاستخدام"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {/* Message Body */}
            <div className="form-group mb-4">
              <label className="form-label">نص الرسالة</label>
              <textarea
                rows={5}
                required
                className="form-input"
                placeholder="اكتب نص الإشعار بالتفصيل..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button variant="primary" type="submit" isLoading={isSending} className="w-full">
              🚀 إرسال الإشعار الآن
            </Button>
          </form>
        </div>

        {/* Sent History & Channels Summary */}
        <div className="dashboard-card">
          <h3>سجل الإرسال الحديث وقنوات التوصيل</h3>
          <p className="card-subtitle mb-3">الإشعارات والتنبيهات الموجهة للمستخدمين</p>

          <div className="notifications-history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item-card">
                <div className="history-header">
                  <strong>{item.title}</strong>
                  <span className="history-time text-muted">{item.timestamp}</span>
                </div>
                <p className="history-msg">{item.message}</p>
                <div className="history-meta">
                  <Badge variant="info">{item.recipientType}</Badge>
                  <Badge variant="neutral">القناة: {item.channel.toUpperCase()}</Badge>
                  <span className="delivery-status text-success">✓ تم التسليم</span>
                </div>
              </div>
            ))}
          </div>

          <div className="channel-health-box mt-4">
            <h4>جاهزية قنوات الإرسال الخارجية:</h4>
            <ul className="channel-status-list">
              <li>
                <span>🔔 In-App Notifications:</span>
                <Badge variant="success">نشط وتلقائي</Badge>
              </li>
              <li>
                <span>✉️ SMTP Mailer:</span>
                <Badge variant="info">مضبوط في الإعدادات</Badge>
              </li>
              <li>
                <span>💬 Twilio SMS Gateway:</span>
                <Badge variant="warning">جاهز للاستقبال</Badge>
              </li>
              <li>
                <span>🟢 WhatsApp Business API:</span>
                <Badge variant="info">متاح للربط</Badge>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
