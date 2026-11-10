import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صالح');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.forgotPassword(email);
      showToast(res.message || 'تم إرسال تعليمات الاستعادة بنجاح', 'info');
      if (res.data?.debugToken) {
        setDebugToken(res.data.debugToken);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل إرسال طلب الاستعادة', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">🏛</Link>
          <h1 className="auth-title">استعادة كلمة المرور</h1>
          <p className="auth-subtitle">أدخل بريدك الإلكتروني المسجل لإرسال رمز إعادة التعيين</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            label="البريد الإلكتروني"
            type="email"
            required
            value={email}
            error={error}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@domain.com"
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            إرسال رابط إعادة التعيين
          </Button>
        </form>

        {debugToken ? (
          <div className="debug-token-box">
            <span className="badge badge-warning">رمز تجريبي (Dev Mode):</span>
            <p className="token-code">{debugToken}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/reset-password?token=${debugToken}`)}
            >
              الانتقال لصفحة إعادة التعيين بهذا الرمز
            </Button>
          </div>
        ) : null}

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            ← العودة لصفحة تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
};
