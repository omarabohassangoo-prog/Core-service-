import React, { useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';

interface ServiceCard {
  type: string;
  name: string;
  icon: string;
  desc: string;
}

export const ServicesTestingPage: React.FC = () => {
  const { showToast } = useToast();
  const [loadingService, setLoadingService] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { connected: boolean; message: string }>>({});

  const services: ServiceCard[] = [
    {
      type: 'email',
      name: 'خادم البريد الإلكتروني (SMTP)',
      icon: '📧',
      desc: 'فحص الاتصال بخادم البريد الصادر SMTP والتحقق من كلمة المرور المشفرة.',
    },
    {
      type: 'sms',
      name: 'بوابة الرسائل القصيرة (Twilio SMS)',
      icon: '💬',
      desc: 'التحقق من حساب Twilio Account SID و Auth Token ورقم الإرسال.',
    },
    {
      type: 'whatsapp',
      name: 'واتساب الأعمال (Meta Cloud API)',
      icon: '📱',
      desc: 'فحص رمز تفويض Meta وربط معرف الهاتف بالمنصة المؤسسية.',
    },
    {
      type: 'paypal',
      name: 'بوابة الدفع (PayPal Orders API)',
      icon: '💳',
      desc: 'التحقق من بيانات اعتماد PayPal Client ID و Secret في بيئة Sandbox أو Live.',
    },
    {
      type: 'storage',
      name: 'مشغل التخزين والوسائط (S3 / Local)',
      icon: '🗄️',
      desc: 'فحص صلاحية القراءة والكتابة على مشغل التخزين المحلي أو حاوية AWS S3.',
    },
  ];

  const handleTest = async (type: string) => {
    setLoadingService(type);
    try {
      const res = await adminApi.testService(type);
      if (res.data) {
        setResults((prev) => ({ ...prev, [type]: res.data! }));
        showToast(res.data.message, res.data.connected ? 'success' : 'warning');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'فشل الاتصال بالخدمة';
      setResults((prev) => ({ ...prev, [type]: { connected: false, message: msg } }));
      showToast(msg, 'error');
    } finally {
      setLoadingService(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>فحص وتشخيص الخدمات الخارجية والتكامل السحابي</h2>
          <p className="text-muted">
            اختبار اتصال الخدمات الخارجية مع وضع المحاكاة التلقائي (Mock Mode) عند غياب الإعدادات الحية
          </p>
        </div>
      </div>

      <div className="services-test-grid">
        {services.map((svc) => {
          const result = results[svc.type];
          const isLoading = loadingService === svc.type;

          return (
            <div key={svc.type} className="service-test-card">
              <div className="svc-header">
                <span className="svc-icon">{svc.icon}</span>
                <div>
                  <h3 className="svc-title">{svc.name}</h3>
                  <code className="svc-tag">service: {svc.type}</code>
                </div>
              </div>

              <p className="svc-desc">{svc.desc}</p>

              {result ? (
                <div className={`svc-result-box ${result.connected ? 'success' : 'error'}`}>
                  <strong>{result.connected ? '✔ الاتصال ناجح ومستقر' : '✖ خطأ في الاتصال'}:</strong>
                  <p>{result.message}</p>
                </div>
              ) : null}

              <div className="svc-footer">
                <Button
                  variant="primary"
                  isLoading={isLoading}
                  onClick={() => handleTest(svc.type)}
                  className="w-full"
                >
                  {isLoading ? 'جاري الاختبار والاتصال...' : 'فحص الاتصال الفوري'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
