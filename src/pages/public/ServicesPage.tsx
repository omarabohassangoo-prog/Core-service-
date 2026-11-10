import React, { useEffect, useState } from 'react';
import { publicApi } from '../../api/public.api';
import { PageItem } from '../../types';

export const ServicesPage: React.FC = () => {
  const [page, setPage] = useState<PageItem | null>(null);

  useEffect(() => {
    publicApi.getPage('services').then((res) => {
      if (res.data) setPage(res.data);
    }).catch(() => null);
  }, []);

  const services = [
    { title: 'خوادم البريد الإلكتروني SMTP', desc: 'إرسال الإشعارات والتنبيهات الموثوقة عبر بروتوكول SMTP مع تشفير كلمات المرور.' },
    { title: 'الرسائل النصية القصيرة SMS', desc: 'تكامل مباشر مع Twilio لإرسال رموز التحقق وإشعارات الحساب الفورية.' },
    { title: 'Meta WhatsApp Cloud API', desc: 'تواصل تفاعلي وقوالب معتمدة عبر واجهات واتساب السحابية الرسمية.' },
    { title: 'بوابات الدفع الإلكتروني PayPal', desc: 'معالجة المدفوعات والطلبات السريعة في بيئة الاختبار والإنتاج.' },
    { title: 'التخزين السحابي الآمن S3 / Local', desc: 'إدارة ملفات الوسائط والمرفقات مع دعم التخزين المحلي وخوادم AWS S3.' },
    { title: 'النسخ الاحتياطي والاستعادة الفورية', desc: 'تصدير لقطات كاملة لقواعد البيانات وسجلات التدقيق مع كود استعادة مزدوج.' },
  ];

  return (
    <div className="content-page container">
      <header className="page-header">
        <h1 className="page-title">{page ? page.title : 'خدماتنا وحلولنا البرمجية'}</h1>
        <p className="page-intro">
          حلول متكاملة تغطي كافة متطلبات الأنظمة والشركات من إدارة الهوية إلى التكامل السحابي.
        </p>
      </header>

      <div className="services-grid">
        {services.map((s, idx) => (
          <div key={idx} className="service-card">
            <span className="service-number">0{idx + 1}</span>
            <h3 className="service-title">{s.title}</h3>
            <p className="service-desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
