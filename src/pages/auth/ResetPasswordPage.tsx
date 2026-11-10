import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!token.trim()) errs.token = 'رمز التحقق مطلوب';
    if (!password || password.length < 8) {
      errs.password = 'كلمة المرور يجب ألا تقل عن 8 أحرف';
    } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      errs.password = 'يجب أن تحتوي كلمة المرور على حرف كبير ورقم';
    }
    if (password !== confirmPassword) {
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
      const res = await authApi.resetPassword(token, password);
      showToast(res.message || 'تمت إعادة تعيين كلمة المرور بنجاح!', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل إعادة تعيين كلمة المرور', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">🏛</Link>
          <h1 className="auth-title">تعيين كلمة مرور جديدة</h1>
          <p className="auth-subtitle">أدخل كلمة المرور الجديدة مع الرمز المرسل لحسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="رمز التحقق (Token)"
            required
            value={token}
            error={errors.token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="الرمز السري للاستعادة"
          />

          <Input
            label="كلمة المرور الجديدة"
            type="password"
            required
            hint="8 أحرف، حرف كبير ورقم"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Input
            label="تأكيد كلمة المرور"
            type="password"
            required
            value={confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            تحديث كلمة المرور
          </Button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            ← العودة لصفحة تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
};
