import React, { useEffect, useState, useCallback } from 'react';
import { userApi } from '../../api/user.api';
import { NotificationItem, PaginatedResult } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const UserNotificationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<PaginatedResult<NotificationItem> | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userApi.getNotifications(page, 15);
      if (res.data) setData(res.data);
    } catch {
      showToast('فشل تحميل الإشعارات', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    // Optimistic UI update
    if (data) {
      setData({
        ...data,
        items: data.items.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item
        ),
      });
    }

    try {
      await userApi.markNotificationAsRead(id);
      showToast('تم تحديد الإشعار كمقروء', 'info');
    } catch {
      showToast('فشل تحديث حالة الإشعار', 'error');
      fetchNotifications();
    }
  };

  return (
    <div className="user-page">
      <div className="page-title-bar">
        <div>
          <h2>مركز الإشعارات والتنبيهات</h2>
          <p className="text-muted">الرسائل الموجهة لحسابك وتحديثات الأمان</p>
        </div>
      </div>

      <div className="data-table-container">
        {isLoading ? (
          <div className="page-loader">
            <div className="spinner-large" />
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="notifications-list">
            {data.items.map((n) => {
              const isUnread = !n.readAt;
              return (
                <div
                  key={n.id}
                  className={`notification-item-card ${isUnread ? 'unread' : 'read'}`}
                >
                  <div className="notif-header">
                    <div className="notif-title-row">
                      <span className="notif-bullet">{isUnread ? '🔵' : '⚪'}</span>
                      <h4 className="notif-title">{n.title}</h4>
                      <Badge
                        variant={
                          n.type === 'SUCCESS'
                            ? 'success'
                            : n.type === 'ALERT'
                            ? 'danger'
                            : n.type === 'WARNING'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {n.type}
                      </Badge>
                    </div>
                    <span className="notif-date">
                      {new Date(n.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>

                  <p className="notif-message">{n.message}</p>

                  <div className="notif-footer">
                    {isUnread ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(n.id)}
                      >
                        تحديد كمقروء
                      </Button>
                    ) : (
                      <span className="text-muted text-sm">
                        تمت القراءة: {new Date(n.readAt!).toLocaleTimeString('ar-EG')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="pagination-bar">
              <span className="pagination-info">
                إجمالي {data.meta.total} إشعار — صفحة {data.meta.page} من {data.meta.totalPages}
              </span>
              <div className="pagination-buttons">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasPrevPage}
                  onClick={() => setPage(page - 1)}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasNextPage}
                  onClick={() => setPage(page + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>لا توجد إشعارات مسجلة لحسابك حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
};
