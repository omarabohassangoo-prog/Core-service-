import React, { useEffect, useState } from 'react';
import { publicApi } from '../../api/public.api';
import { PageItem } from '../../types';

export const TermsPage: React.FC = () => {
  const [page, setPage] = useState<PageItem | null>(null);

  useEffect(() => {
    publicApi.getPage('terms').then((res) => {
      if (res.data) setPage(res.data);
    }).catch(() => null);
  }, []);

  return (
    <div className="content-page container">
      <header className="page-header">
        <h1 className="page-title">{page ? page.title : 'الشروط والأحكام وسياسة الخصوصية'}</h1>
        <p className="page-intro">السياسات الحاكمة لاستخدام البنية المؤسسية وحماية البيانات وسجلات التدقيق.</p>
      </header>

      <div className="page-card prose">
        <p>{page ? page.content : 'جاري تحميل الشروط والأحكام...'}</p>
        <hr />
        <h3>1. إدارة الهوية والبيانات</h3>
        <p>يلتزم المستخدم بالمحافظة على سرية بيانات تسجيل الدخول وعدم مشاركة التوكنات الخاصة بجلساته مع أي طرف ثالث.</p>

        <h3>2. سجلات التدقيق (Audit Logs)</h3>
        <p>تخضع جميع الأنشطة والعمليات الإدارية للتسجيل الآلي المشفر متضمناً عنوان IP ونوع المتصفح ووقت التنفيذ لأغراض الأمان والامتثال.</p>

        <h3>3. سياسة التشفير والأمان</h3>
        <p>تُشفر كافة البيانات الحساسة مثل بيانات الاتصال بالبوابات وخوادم البريد بخوارزميات متطورة وفق مواصفات بروتوكول Enterprise.</p>
      </div>
    </div>
  );
};
