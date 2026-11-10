import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { RoleItem, PermissionItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const RolesManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    slug: '',
    description: '',
    selectedPermissions: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        adminApi.listRoles(),
        adminApi.listPermissions(),
      ]);
      if (rolesRes.data) setRoles(rolesRes.data);
      if (permsRes.data) setPermissions(permsRes.data);
    } catch {
      showToast('فشل تحميل الأدوار والصلاحيات', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      slug: '',
      description: '',
      selectedPermissions: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: RoleItem) => {
    if (role.slug === 'super_admin') {
      showToast('دور مدير النظام الأعلى يمتلك كافة الصلاحيات حكماً ولا يمكن تقييده', 'warning');
      return;
    }
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      selectedPermissions: role.permissions.map((p) => p.permission.slug),
    });
    setIsModalOpen(true);
  };

  const togglePermission = (slug: string) => {
    setRoleForm((prev) => {
      const exists = prev.selectedPermissions.includes(slug);
      return {
        ...prev,
        selectedPermissions: exists
          ? prev.selectedPermissions.filter((s) => s !== slug)
          : [...prev.selectedPermissions, slug],
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingRole) {
        const res = await adminApi.updateRole(editingRole.id, {
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.selectedPermissions,
        });
        showToast(res.message || 'تم تحديث الدور بنجاح', 'success');
      } else {
        const res = await adminApi.createRole({
          name: roleForm.name,
          slug: roleForm.slug,
          description: roleForm.description,
          permissions: roleForm.selectedPermissions,
        });
        showToast(res.message || 'تم إنشاء الدور بنجاح', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشلت العملية', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>الأدوار ونظام الصلاحيات الحبيبي (RBAC)</h2>
          <p className="text-muted">إدارة الصلاحيات الممنوحة لكل دور وظيفي في المنظومة المؤسسية</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + إنشاء دور جديد
        </Button>
      </div>

      <div className="roles-grid">
        {isLoading ? (
          <div className="page-loader">
            <div className="spinner-large" />
          </div>
        ) : (
          roles.map((r) => (
            <div key={r.id} className="role-card">
              <div className="role-card-header">
                <div>
                  <h3 className="role-name">{r.name}</h3>
                  <code className="role-slug">{r.slug}</code>
                </div>
                <Badge variant={r.isSystem ? 'danger' : 'info'}>
                  {r.isSystem ? 'نظام أساسي' : 'مخصص'}
                </Badge>
              </div>

              <p className="role-description">{r.description || 'لا يوجد وصف محدد لهذا الدور'}</p>

              <div className="role-stats">
                <span>المستخدمون المرتبطون: <strong>{r._count?.users || 0}</strong></span>
                <span>الصلاحيات: <strong>{r.slug === 'super_admin' ? 'جميع الصلاحيات (*)' : r.permissions.length}</strong></span>
              </div>

              <div className="role-permissions-preview">
                {r.slug === 'super_admin' ? (
                  <Badge variant="success">كامل الصلاحيات (Super Admin All Access)</Badge>
                ) : (
                  r.permissions.slice(0, 5).map((p) => (
                    <span key={p.permission.slug} className="perm-tag">
                      {p.permission.slug}
                    </span>
                  ))
                )}
                {r.slug !== 'super_admin' && r.permissions.length > 5 ? (
                  <span className="perm-more">+{r.permissions.length - 5} صلاحيات أخرى</span>
                ) : null}
              </div>

              <div className="role-card-footer">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={r.slug === 'super_admin'}
                  onClick={() => handleOpenEdit(r)}
                  className="w-full"
                >
                  {r.slug === 'super_admin' ? 'محمي بواسطة النظام' : 'تعديل الصلاحيات'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Role Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `تعديل الدور: ${editingRole.name}` : 'إنشاء دور مخصص جديد'}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {editingRole ? 'حفظ الصلاحيات' : 'تأكيد إنشاء الدور'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="modal-form">
          <Input
            label="اسم الدور"
            required
            value={roleForm.name}
            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
            placeholder="مثال: مدير المبيعات"
          />

          {!editingRole ? (
            <Input
              label="المعرف البرمجي (Slug)"
              required
              hint="أحرف إنجليزية صغيرة وشرطة سفلية فقط"
              value={roleForm.slug}
              onChange={(e) => setRoleForm({ ...roleForm, slug: e.target.value })}
              placeholder="sales_manager"
            />
          ) : null}

          <Input
            label="الوصف التوضيحي"
            value={roleForm.description}
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
            placeholder="موجز عن نطاق وصلاحيات هذا الدور"
          />

          <div className="permissions-picker-section">
            <label className="form-label">
              الصلاحيات الممنوحة لهذا الدور ({roleForm.selectedPermissions.length} محددة):
            </label>
            <div className="permissions-grid">
              {permissions.map((perm) => {
                const isSelected = roleForm.selectedPermissions.includes(perm.slug);
                return (
                  <div
                    key={perm.slug}
                    className={`perm-checkbox-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => togglePermission(perm.slug)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                    />
                    <div>
                      <strong>{perm.slug}</strong>
                      <p>{perm.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
