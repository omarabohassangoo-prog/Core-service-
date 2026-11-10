import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim() || form.firstName.length < 2) {
      errs.firstName = 'الاسم الأول مطلوب (حرفين على الأقل)';
    }
    if (!form.lastName.trim() || form.lastName.length < 2) {
      errs.lastName = 'الاسم الأخير مطلوب (حرفين على الأقل)';
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      errs.email = 'البريد الإلكتروني غير صالح';
    }
    if (!form.password || form.password.length < 8) {
      errs.password = 'كلمة المرور يجب أن لا تقل عن 8 أحرف';
    } else if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errs.password = 'يجب أن تحتوي كلمة المرور على حرف كبير ورقم';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });

      if (res.success && res.data) {
        login(res.data);
        showToast(res.message || 'تم إنشاء الحساب بنجاح!', 'success');
        navigate(res.data.redirectPath || '/user', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'فشل إنشاء الحساب';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">🏛</Link>
          <h1 className="auth-title">إنشاء حساب جديد</h1>
          <p className="auth-subtitle">سجل حسابك للوصول إلى لوحة المستخدم والخدمات</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <Input
              label="الاسم الأول"
              required
              value={form.firstName}
              error={errors.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              label="الاسم الأخير"
              required
              value={form.lastName}
              error={errors.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>

          <Input
            label="البريد الإلكتروني"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="user@domain.com"
          />

          <Input
            label="رقم الهاتف"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+966 50 000 0000"
          />

          <Input
            label="كلمة المرور"
            type="password"
            required
            autoComplete="new-password"
            hint="8 أحرف كحد أدنى، متضمنة حرفاً كبيراً ورقم"
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />

          <Input
            label="تأكيد كلمة المرور"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="••••••••"
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            تأكيد وإنشاء الحساب
          </Button>
        </form>

        <div className="auth-footer">
          <span>لديك حساب بالفعل؟ </span>
          <Link to="/login" className="auth-link font-bold">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
};
