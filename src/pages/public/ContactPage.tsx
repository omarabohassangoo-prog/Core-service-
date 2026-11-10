import React, { useState } from 'react';
import { publicApi } from '../../api/public.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) errs.name = 'الاسم يجب ألا يقل عن حرفين';
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'البريد الإلكتروني غير صالح';
    if (!form.subject.trim() || form.subject.length < 3) errs.subject = 'الموضوع يجب ألا يقل عن 3 أحرف';
    if (!form.message.trim() || form.message.length < 10) errs.message = 'الرسالة يجب ألا تقل عن 10 أحرف';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await publicApi.submitContact(form);
      if (res.success) {
        showToast(res.message || 'تم إرسال رسالتك بنجاح!', 'success');
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'فشل إرسال الرسالة';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="content-page container">
      <header className="page-header">
        <h1 className="page-title">اتصل بنا — مركز الدعم المؤسسي</h1>
        <p className="page-intro">
          فريق الدعم الهندسي والفني جاهز لخدمتكم والإجابة على أي استفسارات تخص تكامل النظام.
        </p>
      </header>

      <div className="contact-grid">
        <div className="contact-info-card">
          <h3>معلومات الاتصال المباشر</h3>
          <p>يسعدنا تلقي استفساراتك وسيقوم فريق الدعم الفني بالرد خلال 24 ساعة عمل.</p>

          <div className="contact-details">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <div>
                <strong>البريد الإلكتروني:</strong>
                <p>support@enterprise.local</p>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <strong>الهاتف المباشر:</strong>
                <p>+966 11 000 0000</p>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">🏢</span>
              <div>
                <strong>المقر الرئيسي:</strong>
                <p>مركز التقنية المالية والأعمال</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-card">
          <h3>إرسال رسالة أو طلب استشارة</h3>
          <form onSubmit={handleSubmit} className="contact-form">
            <Input
              label="الاسم الكامل"
              required
              value={form.name}
              error={errors.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div className="form-row">
              <Input
                label="البريد الإلكتروني"
                type="email"
                required
                value={form.email}
                error={errors.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="رقم الهاتف"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <Input
              label="موضوع الرسالة"
              required
              value={form.subject}
              error={errors.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />

            <div className={`form-group ${errors.message ? 'has-error' : ''}`}>
              <label className="form-label">
                نص الرسالة / الاستفسار <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-input form-textarea"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="اكتب تفاصيل استفسارك هنا..."
              />
              {errors.message ? <span className="form-error">{errors.message}</span> : null}
            </div>

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              إرسال الرسالة إلى الدعم الفني
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
