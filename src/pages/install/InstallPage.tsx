import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { installApi } from '../../api/install.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const InstallPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    siteName: 'نظام Enterprise المتكامل',
    siteUrl: window.location.origin,
    adminEmail: 'admin@enterprise.local',
    adminPassword: '',
    adminFirstName: 'المدير',
    adminLastName: 'الأعلى',
    adminPhone: '+966500000000',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.siteName.trim()) errs.siteName = 'اسم الموقع مطلوب';
    if (!form.siteUrl.trim()) errs.siteUrl = 'رابط الموقع مطلوب';
    if (!form.adminEmail.trim() || !form.adminEmail.includes('@')) {
      errs.adminEmail = 'البريد الإلكتروني غير صالح';
    }
    if (!form.adminPassword || form.adminPassword.length < 8) {
      errs.adminPassword = 'كلمة المرور يجب أن لا تقل عن 8 أحرف';
    } else if (!/[A-Z]/.test(form.adminPassword) || !/[0-9]/.test(form.adminPassword)) {
      errs.adminPassword = 'يجب أن تحتوي كلمة المرور على حرف كبير ورقم على الأقل';
    }
    if (!form.adminFirstName.trim()) errs.adminFirstName = 'الاسم الأول مطلوب';
    if (!form.adminLastName.trim()) errs.adminLastName = 'الاسم الأخير مطلوب';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await installApi.setup(form);
      if (res.success) {
        showToast(res.message || 'تم تنصيب النظام بنجاح!', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'فشل تنفيذ عملية التنصيب';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="install-wrapper">
      <div className="install-card">
        <div className="install-header">
          <span className="install-badge">الخطوة الأولى</span>
          <h1 className="install-title">معالج تنصيب نظام Enterprise</h1>
          <p className="install-subtitle">
            هذا المعالج مخصص لتأسيس النظام لأول مرة. بعد اكتمال التنصيب يتم قفل هذا المعالج تلقائياً.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="install-form">
          <div className="form-section">
            <h3 className="section-title">بيانات المنشأة والموقع</h3>
            <Input
              label="اسم الموقع / المنشأة"
              required
              value={form.siteName}
              error={errors.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            />
            <Input
              label="الرابط الأساسي للموقع"
              required
              value={form.siteUrl}
              error={errors.siteUrl}
              onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
            />
          </div>

          <div className="form-section">
            <h3 className="section-title">بيانات المدير الأعلى (Super Admin)</h3>
            <div className="form-row">
              <Input
                label="الاسم الأول"
                required
                value={form.adminFirstName}
                error={errors.adminFirstName}
                onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })}
              />
              <Input
                label="الاسم الأخير"
                required
                value={form.adminLastName}
                error={errors.adminLastName}
                onChange={(e) => setForm({ ...form, adminLastName: e.target.value })}
              />
            </div>
            <Input
              label="البريد الإلكتروني للمدير"
              type="email"
              required
              value={form.adminEmail}
              error={errors.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
            />
            <Input
              label="كلمة المرور المشفرة"
              type="password"
              required
              placeholder="مثال: Admin@Enterprise2026"
              hint="يجب أن تحتوي على 8 أحرف على الأقل، مع حرف كبير ورقم"
              value={form.adminPassword}
              error={errors.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
            />
            <Input
              label="رقم الهاتف (اختياري)"
              type="tel"
              value={form.adminPhone}
              onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
            />
          </div>

          <div className="install-actions">
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              تثبيت النظام وتوليد قاعدة البيانات المؤسسية
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
