import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email.trim() || !form.email.includes('@')) {
      errs.email = 'يرجى إدخال بريد إلكتروني صالح';
    }
    if (!form.password) {
      errs.password = 'يرجى إدخال كلمة المرور';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      if (res.success && res.data) {
        login(res.data);
        showToast(res.message || 'تم تسجيل الدخول بنجاح!', 'success');
        navigate(res.data.redirectPath || '/user', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'بيانات الدخول غير صحيحة';
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
          <h1 className="auth-title">تسجيل الدخول</h1>
          <p className="auth-subtitle">أدخل بيانات اعتمادك للوصول إلى لوحة التحكم الخاصة بك</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="البريد الإلكتروني"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="example@enterprise.local"
          />

          <Input
            label="كلمة المرور"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />

          <div className="auth-meta">
            <Link to="/forgot-password" className="auth-link">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            دخول إلى النظام
          </Button>
        </form>

        <div className="auth-footer">
          <span>ليس لديك حساب بعد؟ </span>
          <Link to="/register" className="auth-link font-bold">
            تسجيل حساب جديد
          </Link>
        </div>

        <div className="auth-hint-box">
          <small>
            <strong>بيانات الدخول الافتراضية للمدير:</strong>
            <br />
            البريد: <code>admin@enterprise.local</code> | كلمة المرور: <code>Admin@Enterprise2026</code>
          </small>
        </div>
      </div>
    </div>
  );
};
