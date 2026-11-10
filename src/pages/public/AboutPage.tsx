import React, { useEffect, useState } from 'react';
import { publicApi } from '../../api/public.api';
import { PageItem } from '../../types';

export const AboutPage: React.FC = () => {
  const [page, setPage] = useState<PageItem | null>(null);

  useEffect(() => {
    publicApi.getPage('about').then((res) => {
      if (res.data) setPage(res.data);
    }).catch(() => null);
  }, []);

  return (
    <div className="content-page container">
      <header className="page-header">
        <h1 className="page-title">{page ? page.title : 'نبذة عنا — رؤيتنا وقيمنا'}</h1>
        <p className="page-intro">
          تعرف على فلسفة التصميم المعماري الصارم، والأهداف الاستراتيجية وراء بناء هذا النظام المؤسسي.
        </p>
      </header>

      <div className="page-card">
        <div className="prose">
          <p>{page ? page.content : 'جاري تحميل المحتوى المؤسسي...'}</p>

          <h3>مبادئنا الأساسية:</h3>
          <ul>
            <li><strong>Zero-Trust Architecture:</strong> لا نثق بأي مدخلات خارجية دون تدقيق صارم بـ Zod.</li>
            <li><strong>Decoupled Subsystems:</strong> عزل تام بين طبقات الباك إند، المتحكمات، وقواعد البيانات.</li>
            <li><strong>Strict Privacy:</strong> تشفير كامل للقيم السرية بـ AES-256-GCM وعدم تسريب أي معلومات حساسة.</li>
            <li><strong>High Availability:</strong> رصد مستمر لصحة النظام عبر نقاط تدقيق /health/ready و /health/live.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
