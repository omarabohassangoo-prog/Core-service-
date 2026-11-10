import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import { UserItem, RoleItem, PaginatedResult } from '../../types';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const UsersManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [usersData, setUsersData] = useState<PaginatedResult<UserItem> | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | undefined>(undefined);

  // Selection for Bulk Actions (Appendix A.3)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [bulkActionRole, setBulkActionRole] = useState<number>(4);
  const [bulkActionStatus, setBulkActionStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'PENDING'>('ACTIVE');
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    roleId: 4,
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED' | 'PENDING',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Change Password Modal State
  const [passwordModalUser, setPasswordModalUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Details Modal State
  const [viewingUser, setViewingUser] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listUsers({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        roleId: roleFilter,
      });
      if (res.data) setUsersData(res.data);
    } catch {
      showToast('فشل تحميل قائمة المستخدمين', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, roleFilter, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    adminApi.listRoles().then((res) => {
      if (res.data) setRoles(res.data);
    });
  }, []);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && usersData) {
      setSelectedUserIds(usersData.items.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'delete' | 'status' | 'role' | 'suspend') => {
    if (selectedUserIds.length === 0) return;

    if (action === 'delete') {
      if (!confirm(`هل أنت متأكد من حذف ${selectedUserIds.length} مستخدم؟ هذا الإجراء نهائي.`)) {
        return;
      }
    }

    setIsBulkOperating(true);
    try {
      let extraValue: string | number | undefined;
      if (action === 'status') extraValue = bulkActionStatus;
      if (action === 'role') extraValue = bulkActionRole;

      const res = await adminApi.bulkUserAction(action, selectedUserIds, extraValue);
      showToast(res.message || 'تم تنفيذ العملية الجماعية بنجاح', 'success');
      setSelectedUserIds([]);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشلت العملية الجماعية', 'error');
    } finally {
      setIsBulkOperating(false);
    }
  };

  // Impersonate User (Appendix A.3 & Protocol)
  const handleImpersonate = async (targetUser: UserItem) => {
    if (currentUser?.role.slug !== 'super_admin') {
      showToast('هذه الميزة مقتصرة حصرياً على المدير العام (Super Admin)', 'error');
      return;
    }
    if (!confirm(`هل ترغب في تسجيل الدخول كـ "${targetUser.firstName} ${targetUser.lastName}"؟ سيتم تحويلك إلى بوابته الشخصية.`)) {
      return;
    }

    try {
      const res = await adminApi.impersonateUser(targetUser.id);
      if (res.data?.accessToken) {
        localStorage.setItem('access_token', res.data.accessToken);
        if (res.data.user) {
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        }
        showToast(`تم تقمص هوية المستخدم (${targetUser.email}) بنجاح`, 'success');
        setTimeout(() => {
          navigate(res.data.redirectPath || '/user');
          window.location.reload();
        }, 300);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'تعذر تقمص هوية المستخدم', 'error');
    }
  };

  // Unlock User Account
  const handleUnlockUser = async (targetUser: UserItem) => {
    try {
      const res = await adminApi.unlockUser(targetUser.id);
      showToast(res.message || 'تم فك قفل الحساب وإعادة تفعيل المحاولات', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'تعذر فك قفل الحساب', 'error');
    }
  };

  // Change Password
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPassword) return;

    setIsChangingPassword(true);
    try {
      const res = await adminApi.adminChangePassword(passwordModalUser.id, newPassword);
      showToast(res.message || 'تم تغيير كلمة المرور بنجاح وإنهاء كافة الجلسات السابقة', 'success');
      setPasswordModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل تغيير كلمة المرور', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      showToast('جاري إنشاء ملف التصدير CSV...', 'info');
      const blob = await adminApi.exportUsers({
        status: statusFilter || undefined,
        roleId: roleFilter,
        search: search || undefined,
      });

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('تم تحميل ملف المستخدمين بنجاح', 'success');
    } catch {
      showToast('فشل تصدير بيانات المستخدمين', 'error');
    }
  };

  // Modal Open Create / Edit
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      roleId: roles.find((r) => r.slug === 'user')?.id || 4,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      password: '',
      roleId: user.roleId,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingUser) {
        const res = await adminApi.updateUser(editingUser.id, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          roleId: formData.roleId,
          status: formData.status,
          password: formData.password || undefined,
        });
        showToast(res.message || 'تم تحديث المستخدم بنجاح', 'success');
      } else {
        const res = await adminApi.createUser({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          password: formData.password,
          roleId: formData.roleId,
          status: formData.status,
        });
        showToast(res.message || 'تم إنشاء المستخدم بنجاح', 'success');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشلت العملية', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Optimistic UI for delete with rollback
  const handleDelete = async (user: UserItem) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المستخدم (${user.firstName} ${user.lastName})؟`)) {
      return;
    }

    const previousData = usersData;
    if (usersData) {
      setUsersData({
        ...usersData,
        items: usersData.items.filter((u) => u.id !== user.id),
        meta: { ...usersData.meta, total: usersData.meta.total - 1 },
      });
    }

    try {
      const res = await adminApi.deleteUser(user.id);
      showToast(res.message || 'تم حذف المستخدم بنجاح', 'success');
    } catch (err: any) {
      setUsersData(previousData);
      showToast(err.response?.data?.message || 'فشل حذف المستخدم', 'error');
    }
  };

  const allSelected =
    usersData && usersData.items.length > 0 && selectedUserIds.length === usersData.items.length;

  return (
    <div className="admin-page">
      {/* Title Bar & Top Actions */}
      <div className="page-title-bar">
        <div>
          <h2>إدارة المستخدمين والحسابات (Appendix A.3)</h2>
          <p className="text-muted">تحكم شامل بالحسابات، العمليات الجماعية، التقمص، التصدير، وإعادة تعيين كلمات المرور</p>
        </div>
        <div className="title-actions">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            📥 تصدير CSV
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            + إضافة مستخدم جديد
          </Button>
        </div>
      </div>

      {/* Floating Bulk Action Bar (Appendix A.3) */}
      {selectedUserIds.length > 0 && (
        <div className="bulk-action-bar">
          <div className="bulk-info">
            <span className="bulk-count-badge">{selectedUserIds.length}</span>
            <span>مستخدم محدد للعمليات الجماعية</span>
          </div>

          <div className="bulk-controls">
            {/* Bulk Suspend */}
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkOperating}
              onClick={() => handleBulkAction('suspend')}
            >
              🔒 تجميد الحسابات
            </Button>

            {/* Bulk Change Status */}
            <div className="bulk-group">
              <select
                className="form-input form-select input-sm"
                value={bulkActionStatus}
                onChange={(e) => setBulkActionStatus(e.target.value as any)}
              >
                <option value="ACTIVE">تفعيل (ACTIVE)</option>
                <option value="PENDING">تعليق (PENDING)</option>
                <option value="SUSPENDED">تعطيل (SUSPENDED)</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkOperating}
                onClick={() => handleBulkAction('status')}
              >
                تطبيق الحالة
              </Button>
            </div>

            {/* Bulk Change Role */}
            <div className="bulk-group">
              <select
                className="form-input form-select input-sm"
                value={bulkActionRole}
                onChange={(e) => setBulkActionRole(Number(e.target.value))}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkOperating}
                onClick={() => handleBulkAction('role')}
              >
                تغيير الدور
              </Button>
            </div>

            {/* Bulk Delete */}
            <Button
              variant="primary"
              size="sm"
              className="btn-danger"
              disabled={isBulkOperating}
              onClick={() => handleBulkAction('delete')}
            >
              🗑️ حذف جماعي
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserIds([])}
            >
              إلغاء التحديد
            </Button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="table-controls-card">
        <div className="search-field">
          <input
            type="text"
            className="form-input"
            placeholder="بحث بالاسم أو البريد الإلكتروني أو الهاتف..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <select
            className="form-input form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">جميع الحالات</option>
            <option value="ACTIVE">نشط (ACTIVE)</option>
            <option value="SUSPENDED">معطل (SUSPENDED)</option>
            <option value="PENDING">معلق (PENDING)</option>
          </select>

          <select
            className="form-input form-select"
            value={roleFilter || ''}
            onChange={(e) => {
              setRoleFilter(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
          >
            <option value="">جميع الأدوار</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.slug})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="data-table-container">
        {isLoading ? (
          <div className="page-loader">
            <div className="spinner-large" />
          </div>
        ) : usersData && usersData.items.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={!!allSelected}
                      onChange={handleSelectAll}
                      title="تحديد الكل"
                    />
                  </th>
                  <th>المعرف</th>
                  <th>المستخدم</th>
                  <th>البريد الإلكتروني</th>
                  <th>الدور الوظيفي</th>
                  <th>الحالة والأمان</th>
                  <th>تاريخ التسجيل</th>
                  <th>الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody>
                {usersData.items.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();

                  return (
                    <tr key={u.id} className={isSelected ? 'row-selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(u.id)}
                        />
                      </td>
                      <td>#{u.id}</td>
                      <td>
                        <div className="user-table-profile">
                          <strong
                            className="clickable-user-name"
                            onClick={() => setViewingUser(u)}
                            title="عرض تفاصيل المستخدم"
                          >
                            {u.firstName} {u.lastName}
                          </strong>
                          {u.phone ? <small className="text-muted">{u.phone}</small> : null}
                        </div>
                      </td>
                      <td><code>{u.email}</code></td>
                      <td>
                        <Badge variant={u.role.slug === 'super_admin' ? 'danger' : 'info'}>
                          {u.role.name}
                        </Badge>
                      </td>
                      <td>
                        <div className="status-cell-flex">
                          <Badge
                            variant={
                              u.status === 'ACTIVE'
                                ? 'success'
                                : u.status === 'SUSPENDED'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {u.status}
                          </Badge>
                          {isLocked && (
                            <Badge variant="danger" title="الحساب مقفل مؤقتاً بسبب تكرار المحاولات">
                              🔒 مقفل
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td>
                        <div className="table-actions">
                          {/* Impersonate Button (super_admin only) */}
                          {currentUser?.role.slug === 'super_admin' && currentUser.id !== u.id && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-info"
                              onClick={() => handleImpersonate(u)}
                              title="تقمص هوية المستخدم (Impersonate)"
                            >
                              🎭 تقمص
                            </button>
                          )}

                          {/* Unlock Button */}
                          {isLocked && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-warning"
                              onClick={() => handleUnlockUser(u)}
                              title="فك قفل الحساب"
                            >
                              🔓 فك
                            </button>
                          )}

                          {/* Change Password */}
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-muted"
                            onClick={() => {
                              setPasswordModalUser(u);
                              setNewPassword('');
                            }}
                            title="تغيير كلمة المرور"
                          >
                            🔑
                          </button>

                          {/* Edit */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(u)}
                          >
                            تعديل
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger"
                            onClick={() => handleDelete(u)}
                          >
                            حذف
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination-bar">
              <span className="pagination-info">
                إجمالي {usersData.meta.total} مستخدم — صفحة {usersData.meta.page} من {usersData.meta.totalPages}
              </span>
              <div className="pagination-buttons">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!usersData.meta.hasPrevPage}
                  onClick={() => setPage(page - 1)}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!usersData.meta.hasNextPage}
                  onClick={() => setPage(page + 1)}
                >
                  التالي
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>لا يوجد مستخدمين يطابقون معايير البحث الحالية.</p>
          </div>
        )}
      </div>

      {/* User Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `تعديل المستخدم #${editingUser.id}` : 'إضافة مستخدم جديد'}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {editingUser ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="modal-form">
          <div className="form-row">
            <Input
              label="الاسم الأول"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              label="الاسم الأخير"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <Input
            label="البريد الإلكتروني"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="رقم الهاتف"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label={editingUser ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'}
            type="password"
            required={!editingUser}
            placeholder={editingUser ? '••••••••' : 'Admin@Enterprise2026'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الدور الوظيفي</label>
              <select
                className="form-input form-select"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">الحالة</label>
              <select
                className="form-input form-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
              >
                <option value="ACTIVE">نشط (ACTIVE)</option>
                <option value="SUSPENDED">معطل (SUSPENDED)</option>
                <option value="PENDING">معلق (PENDING)</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Admin Change Password Modal */}
      <Modal
        isOpen={!!passwordModalUser}
        onClose={() => setPasswordModalUser(null)}
        title={`إعادة تعيين كلمة المرور للمستخدم (${passwordModalUser?.email})`}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setPasswordModalUser(null)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              onClick={handleChangePasswordSubmit}
              isLoading={isChangingPassword}
              disabled={!newPassword}
            >
              تغيير كلمة المرور وإنهاء الجلسات
            </Button>
          </div>
        }
      >
        <form onSubmit={handleChangePasswordSubmit} className="modal-form">
          <p className="text-muted mb-3">
            سيؤدي هذا الإجراء إلى تغيير كلمة المرور للمستخدم فوراً، وإنهاء كافة جلسات تسجيل الدخول النشطة (Revoke all refresh tokens).
          </p>
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            required
            placeholder="أدخل كلمة مرور قوية (8 أحرف، كابيتال، رقم، رمز)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </form>
      </Modal>

      {/* User Details Modal */}
      <Modal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title={`بطاقة المستخدم #${viewingUser?.id}`}
        footer={
          <Button variant="outline" onClick={() => setViewingUser(null)}>
            إغلاق
          </Button>
        }
      >
        {viewingUser && (
          <div className="user-details-card">
            <div className="detail-row">
              <span className="detail-label">الاسم الكامل:</span>
              <strong>{viewingUser.firstName} {viewingUser.lastName}</strong>
            </div>
            <div className="detail-row">
              <span className="detail-label">البريد الإلكتروني:</span>
              <code>{viewingUser.email}</code>
            </div>
            <div className="detail-row">
              <span className="detail-label">الدور الوظيفي:</span>
              <Badge variant="info">{viewingUser.role.name} ({viewingUser.role.slug})</Badge>
            </div>
            <div className="detail-row">
              <span className="detail-label">الحالة:</span>
              <Badge variant={viewingUser.status === 'ACTIVE' ? 'success' : 'danger'}>
                {viewingUser.status}
              </Badge>
            </div>
            <div className="detail-row">
              <span className="detail-label">تاريخ الإنشاء:</span>
              <span>{new Date(viewingUser.createdAt).toLocaleString('ar-EG')}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
