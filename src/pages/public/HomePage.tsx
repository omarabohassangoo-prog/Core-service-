import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../api/public.api';
import { PageItem } from '../../types';
import { useSettings } from '../../context/SettingsContext';

export const HomePage: React.FC = () => {
  const [page, setPage] = useState<PageItem | null>(null);
  const { get } = useSettings();

  useEffect(() => {
    publicApi.getPage('home').then((res) => {
      if (res.data) setPage(res.data);
    }).catch(() => null);
  }, []);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-badge">معايير Enterprise المؤسسية</span>
            <h1 className="hero-title">
              {get('pages.home.heroTitle', page?.title || 'نظام Enterprise المتكامل متعدد الوحدات')}
            </h1>
            <p className="hero-subtitle">
              {get('pages.home.heroSubtitle', page?.content || 'بنية تحتية برمجية متطورة تعتمد الفصل المعماري التام، المصادقة الثنائية الصارمة، إدارة الصلاحيات RBAC، والتكامل السحابي الآمن.')}
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">
                ابدأ الآن مجاناً
              </Link>
              <Link to="/services" className="btn btn-outline btn-lg">
                استكشف الخدمات
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="system-architecture-card">
              <div className="arch-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="arch-title">Enterprise System Architecture</span>
              </div>
              <div className="arch-layers">
                <div className="arch-layer">
                  <span className="layer-tag">System 1</span>
                  <strong>Installation Guard</strong>
                  <small>تأسيس وقفل تلقائي</small>
                </div>
                <div className="arch-layer">
                  <span className="layer-tag">System 2</span>
                  <strong>Public Pages CMS</strong>
                  <small>محتوى حر ومعدل</small>
                </div>
                <div className="arch-layer">
                  <span className="layer-tag">System 3</span>
                  <strong>Auth & Session Security</strong>
                  <small>JWT Access 15m + Hash 7d</small>
                </div>
                <div className="arch-layer">
                  <span className="layer-tag">System 4</span>
                  <strong>Admin Control Engine</strong>
                  <small>RBAC + 12 Groups + Audit</small>
                </div>
                <div className="arch-layer">
                  <span className="layer-tag">System 5</span>
                  <strong>User Portal Hub</strong>
                  <small>بيانات وهوية معزولة</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-heading text-center">
            <h2>الأنظمة الخمسة الأساسية في المنظومة</h2>
            <p>تم تصميم كل وحدة بنظام منفصل تماماً، مع فصل منطق العمل عن طبقة العرض والتحكم.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>1. نظام التنصيب الذاتي</h3>
              <p>يعمل مرة واحدة عند الإطلاق الأول، ينشئ المدير الأعلى والإعدادات الافتراضية، ثم يقفل نفسه ذاتياً.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>2. الصفحات العامة الديناميكية</h3>
              <p>صفحات مفتوحة للزوار بدون مصادقة، مع إمكانية تعديل نصوصها وبيانات SEO كاملة من لوحة الإدارة.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔑</div>
              <h3>3. المصادقة والتحقق المزدوج</h3>
              <p>جلسات آمنة، تشفير كلمات المرور بـ 12 دورة، وقفل تلقائي ضد هجمات التخمين بعد 5 محاولات.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>4. لوحة الإدارة المركزية</h3>
              <p>إدارة المستخدمين، الأدوار والصلاحيات، 12 مجموعة إعدادات، تكامل البريد وSMS وPayPal، وسجلات التدقيق.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h3>5. بوابة المستخدم المستقلة</h3>
              <p>لوحة تحكم خاصة بالمستخدم لعرض الإشعارات، إدارة الملف الشخصي، واستعراض سجل النشاطات المعزول.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>أداء وتوافقية فائقة</h3>
              <p>معمارية Zero-Trust تضمن التحقق من كل طلب عبر Zod، استعلامات مقيدة بحد أقصى، وتشفير AES-256-GCM.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
