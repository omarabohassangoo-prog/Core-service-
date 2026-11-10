import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { SettingItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const GROUPS = [
  { key: 'general', name: 'العامة (General)', icon: '🌐' },
  { key: 'env', name: 'البيئة (Environment)', icon: '⚙️' },
  { key: 'database', name: 'قاعدة البيانات (Database)', icon: '🗄️' },
  { key: 'email', name: 'البريد الإلكتروني (SMTP)', icon: '📧' },
  { key: 'sms', name: 'الرسائل النصية (SMS Twilio)', icon: '💬' },
  { key: 'whatsapp', name: 'واتساب (Meta Cloud)', icon: '📱' },
  { key: 'paypal', name: 'بوابة الدفع (PayPal)', icon: '💳' },
  { key: 'files', name: 'الملفات والتخزين (Files)', icon: '📁' },
  { key: 'css', name: 'المظهر والسمات (CSS)', icon: '🎨' },
  { key: 'i18n', name: 'اللغات والتدويل (i18n)', icon: '🌍' },
  { key: 'cloud', name: 'السحابة (AWS S3 Cloud)', icon: '☁️' },
  { key: 'secrets', name: 'الأمان والتشفير (Secrets)', icon: '🔒' },
];

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeGroup, setActiveGroup] = useState('general');
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingKey, setIsSavingKey] = useState<string | null>(null);
  const [testingService, setTestingService] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listSettings(activeGroup);
      if (res.data) {
        setSettings(res.data);
        const map: Record<string, string> = {};
        for (const s of res.data) {
          map[s.key] = s.value;
        }
        setValues(map);
      }
    } catch {
      showToast('فشل تحميل الإعدادات', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeGroup, showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSetting = async (key: string) => {
    const value = values[key];
    setIsSavingKey(key);
    try {
      const res = await adminApi.updateSetting(key, value);
      showToast(res.message || `تم حفظ الإعداد [${key}] بنجاح`, 'success');
      // Update with sanitized/masked return
      if (res.data) {
        setValues((prev) => ({ ...prev, [key]: res.data!.value }));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل حفظ الإعداد', 'error');
    } finally {
      setIsSavingKey(null);
    }
  };

  const handleTestService = async (serviceType: string) => {
    setTestingService(true);
    try {
      const res = await adminApi.testService(serviceType);
      if (res.data) {
        showToast(res.data.message, res.data.connected ? 'success' : 'warning');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل فحص اتصال الخدمة', 'error');
    } finally {
      setTestingService(false);
    }
  };

  const getServiceTypeForGroup = (group: string): string | null => {
    if (group === 'email') return 'email';
    if (group === 'sms') return 'sms';
    if (group === 'whatsapp') return 'whatsapp';
    if (group === 'paypal') return 'paypal';
    if (group === 'files' || group === 'cloud') return 'storage';
    return null;
  };

  const currentServiceType = getServiceTypeForGroup(activeGroup);

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>إعدادات النظام والخدمات المؤسسية</h2>
          <p className="text-muted">تحكم بـ 12 مجموعة إعدادات مع التشفير التلقائي للبيانات السرية بـ AES-256-GCM</p>
        </div>
        {currentServiceType ? (
          <Button
            variant="outline"
            isLoading={testingService}
            onClick={() => handleTestService(currentServiceType)}
          >
            🔌 فحص اتصال الخدمة ({currentServiceType})
          </Button>
        ) : null}
      </div>

      <div className="settings-container">
        {/* Group Tabs */}
        <div className="settings-groups-sidebar">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              className={`settings-group-btn ${activeGroup === g.key ? 'active' : ''}`}
              onClick={() => setActiveGroup(g.key)}
            >
              <span className="group-icon">{g.icon}</span>
              <span className="group-name">{g.name}</span>
            </button>
          ))}
        </div>

        {/* Settings List for Selected Group */}
        <div className="settings-form-panel">
          <div className="panel-header">
            <h3>{GROUPS.find((g) => g.key === activeGroup)?.name}</h3>
            <p className="text-muted">
              يتم حفظ كل حقل بشكل منفصل مع التحقق من الصلاحيات وتسجيل العملية في سجلات التدقيق (Audit Logs).
            </p>
          </div>

          {isLoading ? (
            <div className="page-loader">
              <div className="spinner-large" />
            </div>
          ) : settings.length === 0 ? (
            <div className="empty-state">
              <p>لا توجد إعدادات مضافة في هذه المجموعة حالياً.</p>
            </div>
          ) : (
            <div className="settings-fields-list">
              {settings.map((s) => (
                <div key={s.key} className="setting-row-card">
                  <div className="setting-info">
                    <div className="setting-key-title">
                      <code>{s.key}</code>
                      {s.isSecret ? (
                        <Badge variant="danger">سري مشفر (AES-256)</Badge>
                      ) : (
                        <Badge variant="neutral">نص عادي</Badge>
                      )}
                    </div>
                    {s.description ? (
                      <p className="setting-desc">{s.description}</p>
                    ) : null}
                  </div>

                  <div className="setting-input-action">
                    <Input
                      type={s.isSecret ? 'password' : 'text'}
                      value={values[s.key] ?? s.value}
                      placeholder={s.isSecret ? '••••••••' : ''}
                      onChange={(e) =>
                        setValues({ ...values, [s.key]: e.target.value })
                      }
                      hint={s.isSecret ? 'أدخل قيمة جديدة لتحديث السر المشفر أو اتركه كما هو للإبقاء' : undefined}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isSavingKey === s.key}
                      onClick={() => handleSaveSetting(s.key)}
                    >
                      حفظ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
