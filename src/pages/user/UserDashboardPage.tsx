import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../../api/user.api';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../../components/ui/Badge';

export const UserDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<{
    unreadNotifications: number;
    totalNotifications: number;
    recentActivity: Array<{ id: number; action: string; createdAt: string; ipAddress?: string }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    userApi
      .getSummary()
      .then((res) => {
        if (res.data) setSummary(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="user-page">
      <div className="user-welcome-banner">
        <div className="welcome-text">
          <h2>مرحباً بك، {user?.firstName} {user?.lastName}!</h2>
          <p>أهلاً بك في منطقتك الشخصية في نظام Enterprise. يمكنك متابعة التنبيهات وإدارة حسابك بكل يسر.</p>
        </div>
        <div className="welcome-badge">
          <Badge variant="info">دورك الحالي: {user?.role.name}</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="page-loader">
          <div className="spinner-large" />
        </div>
      ) : summary ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon bg-blue">🔔</div>
              <div className="stat-info">
                <span className="stat-label">الإشعارات غير المقروءة</span>
                <span className="stat-value">{summary.unreadNotifications}</span>
                <span className="stat-meta">
                  <Link to="/user/notifications">عرض جميع الإشعارات ({summary.totalNotifications})</Link>
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-green">🛡️</div>
              <div className="stat-info">
                <span className="stat-label">حالة الحساب</span>
                <span className="stat-value">نشط ومحمي</span>
                <span className="stat-meta text-success">تم التحقق من الجلسة بـ JWT</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-purple">⚙️</div>
              <div className="stat-info">
                <span className="stat-label">إعدادات الحساب</span>
                <span className="stat-value">الملف الشخصي</span>
                <span className="stat-meta">
                  <Link to="/user/profile">تحديث البيانات أو كلمة المرور</Link>
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-columns">
            <div className="dashboard-card">
              <h3>سجل النشاطات الشخصية الأخيرة</h3>
              {summary.recentActivity.length > 0 ? (
                <ul className="activity-list">
                  {summary.recentActivity.map((act) => (
                    <li key={act.id} className="activity-item">
                      <span className="act-bullet">•</span>
                      <div className="act-content">
                        <strong>{act.action}</strong>
                        <small>{new Date(act.createdAt).toLocaleString('ar-EG')}</small>
                      </div>
                      {act.ipAddress ? (
                        <span className="act-ip">IP: {act.ipAddress}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">لا توجد نشاطات مسجلة مؤخراً.</p>
              )}
            </div>

            <div className="dashboard-card">
              <h3>روابط الخدمة السريعة</h3>
              <div className="quick-nav-list">
                <Link to="/user/profile" className="quick-nav-item">
                  <span className="q-icon">👤</span>
                  <div>
                    <strong>الملف الشخصي</strong>
                    <small>تحديث الاسم ورقم الهاتف</small>
                  </div>
                </Link>

                <Link to="/user/notifications" className="quick-nav-item">
                  <span className="q-icon">🔔</span>
                  <div>
                    <strong>مركز الإشعارات</strong>
                    <small>استعراض الرسائل الموجهة لحسابك</small>
                  </div>
                </Link>

                <Link to="/services" className="quick-nav-item">
                  <span className="q-icon">🌐</span>
                  <div>
                    <strong>دليل الخدمات العامة</strong>
                    <small>استكشاف الميزات المتوفرة في المنصة</small>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
