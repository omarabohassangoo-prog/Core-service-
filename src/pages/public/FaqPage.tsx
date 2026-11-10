import React, { useState } from 'react';

export const FaqPage: React.FC = () => {
  const faqs = [
    {
      q: 'كيف يعمل نظام التنصيب (Installation System)؟',
      a: 'يعمل نظام التنصيب مرة واحدة فقط عند إطلاق التطبيق لأول مرة؛ حيث يقوم ببذر الأدوار والصلاحيات وإنشاء حساب المدير الأعلى، ثم يتم قفل مساراته تلقائياً لمنع أي تلاعب.',
    },
    {
      q: 'ما هي معايير حماية الجلسات وكلمات المرور؟',
      a: 'تُشفر كلمات المرور بخوارزمية bcrypt مع 12 دورة، وتُمنح التوكنات بمدة 15 دقيقة للـ Access Token و7 أيام للـ Refresh Token المخزن بصيغة SHA-256 hash في قاعدة البيانات.',
    },
    {
      q: 'كيف يتم حماية النظام من هجمات تخمين كلمات المرور؟',
      a: 'عند ارتكاب 5 محاولات دخول خاطئة متتالية، يتم قفل الحساب تلقائياً لمدة 15 دقيقة مع توحيد رسالة الخطأ دائماً لمنع تسريب وجود البريد الإلكتروني.',
    },
    {
      q: 'كيف تعمل خاصية إعادة ضبط المصنع (Factory Reset)؟',
      a: 'خاصية شديدة الحساسية متاحة فقط لمدير النظام الأعلى (Super Admin) وتتطلب كتابة كلمة RESET كرمز تأكيد، وتقوم بتفريغ البيانات التجريبية مع الحفاظ الصارم على حساب المدير الأعلى النشط.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="content-page container">
      <header className="page-header">
        <h1 className="page-title">الأسئلة الشائعة FAQ</h1>
        <p className="page-intro">إجابات شاملة حول الخصائص الأمنية، إدارة الحسابات، وصلاحيات النظام.</p>
      </header>

      <div className="faq-list">
        {faqs.map((item, idx) => (
          <div
            key={idx}
            className={`faq-item ${openIndex === idx ? 'open' : ''}`}
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <div className="faq-question">
              <span>{item.q}</span>
              <span className="faq-toggle">{openIndex === idx ? '−' : '+'}</span>
            </div>
            {openIndex === idx ? <div className="faq-answer">{item.a}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
};
