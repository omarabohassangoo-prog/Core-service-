import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/user.api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const UserProfilePage: React.FC = () => {
  const { user, updateUserData } = useAuth();
  const { showToast } = useToast();

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    userApi.getProfile().then((res) => {
      if (res.data) {
        setProfileForm({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          phone: res.data.phone || '',
        });
      }
    });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      showToast('الاسم الأول والأخير مطلوبان', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await userApi.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone || undefined,
      });

      if (res.data) {
        updateUserData({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
        });
        showToast(res.message || 'تم تحديث الملف الشخصي بنجاح', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل تحديث البيانات', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showToast('يرجى إدخال كلمة المرور الحالية', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToast('كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showToast('كلمتا المرور غير متطابقتين', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast(res.message || 'تم تغيير كلمة المرور بنجاح!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل تغيير كلمة المرور', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="user-page">
      <div className="page-title-bar">
        <div>
          <h2>الملف الشخصي وإعدادات الأمان</h2>
          <p className="text-muted">إدارة بيانات حسابك وتحديث كلمة المرور المشفرة</p>
        </div>
      </div>

      <div className="dashboard-columns">
        {/* Profile Card */}
        <div className="dashboard-card">
          <h3>البيانات الشخصية</h3>
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-row">
              <Input
                label="الاسم الأول"
                required
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
              />
              <Input
                label="الاسم الأخير"
                required
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
              />
            </div>

            <Input
              label="البريد الإلكتروني (غير قابل للتعديل)"
              disabled
              value={user?.email || ''}
              hint="مرتبط بالحساب الرئيسي"
            />

            <Input
              label="رقم الهاتف"
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />

            <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
              حفظ التعديلات
            </Button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="dashboard-card">
          <h3>تغيير كلمة المرور</h3>
          <form onSubmit={handleChangePassword} className="profile-form">
            <Input
              label="كلمة المرور الحالية"
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />

            <Input
              label="كلمة المرور الجديدة"
              type="password"
              required
              hint="8 أحرف كحد أدنى، متضمنة حرفاً كبيراً ورقم"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />

            <Input
              label="تأكيد كلمة المرور الجديدة"
              type="password"
              required
              value={passwordForm.confirmNewPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
            />

            <Button type="submit" variant="primary" isLoading={isChangingPassword}>
              تحديث كلمة المرور وإلغاء الجلسات الأخرى
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
