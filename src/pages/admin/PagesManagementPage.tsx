import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { PageItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const PagesManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [form, setForm] = useState({
    slug: '',
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listPages();
      if (res.data) setPages(res.data);
    } catch {
      showToast('فشل تحميل الصفحات', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleOpenCreate = () => {
    setEditingPage(null);
    setForm({
      slug: '',
      title: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      isPublished: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PageItem) => {
    setEditingPage(p);
    setForm({
      slug: p.slug,
      title: p.title,
      content: p.content,
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      isPublished: p.isPublished,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingPage) {
        const res = await adminApi.updatePage(editingPage.id, form);
        showToast(res.message || 'تم تحديث الصفحة بنجاح', 'success');
      } else {
        const res = await adminApi.createPage(form);
        showToast(res.message || 'تم إنشاء الصفحة بنجاح', 'success');
      }
      setIsModalOpen(false);
      fetchPages();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشلت العملية', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (p: PageItem) => {
    if (!confirm(`هل أنت متأكد من حذف صفحة (${p.title})؟`)) return;
    try {
      const res = await adminApi.deletePage(p.id);
      showToast(res.message || 'تم حذف الصفحة بنجاح', 'success');
      fetchPages();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل حذف الصفحة', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>إدارة الصفحات والمحتوى العام (CMS)</h2>
          <p className="text-muted">التحكم في محتوى الصفحات الثابتة والديناميكية وبيانات محركات البحث SEO</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + إنشاء صفحة جديدة
        </Button>
      </div>

      <div className="data-table-container">
        {isLoading ? (
          <div className="page-loader">
            <div className="spinner-large" />
          </div>
        ) : pages.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>المعرف</th>
                <th>عنوان الصفحة</th>
                <th>مسار URL (Slug)</th>
                <th>الحالة</th>
                <th>تاريخ التحديث</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td><strong>{p.title}</strong></td>
                  <td><code>/{p.slug}</code></td>
                  <td>
                    <Badge variant={p.isPublished ? 'success' : 'neutral'}>
                      {p.isPublished ? 'منشورة' : 'مسودة'}
                    </Badge>
                  </td>
                  <td>{new Date(p.updatedAt).toLocaleDateString('ar-EG')}</td>
                  <td>
                    <div className="table-actions">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(p)}>
                        تعديل
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onClick={() => handleDelete(p)}
                      >
                        حذف
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>لا توجد صفحات مضافة حالياً.</p>
          </div>
        )}
      </div>

      {/* Page Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPage ? `تعديل الصفحة: ${editingPage.title}` : 'إنشاء صفحة جديدة'}
        footer={
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {editingPage ? 'حفظ التعديلات' : 'نشر الصفحة'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="modal-form">
          <Input
            label="عنوان الصفحة"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: الأسئلة الشائعة"
          />

          <Input
            label="المعرف البرمجي (Slug)"
            required
            disabled={!!editingPage}
            hint="أحرف إنجليزية صغيرة وأرقام وشرطة فقط (يحدد رابط الصفحة)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="faq-help"
          />

          <div className="form-group">
            <label className="form-label">
              محتوى الصفحة <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-input form-textarea"
              rows={6}
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="اكتب المحتوى الكامل للصفحة هنا..."
            />
          </div>

          <div className="form-row">
            <Input
              label="عنوان SEO (Meta Title)"
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
              placeholder="العنوان الظاهر لمحركات البحث"
            />
            <Input
              label="وصف SEO (Meta Description)"
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              placeholder="وصف مختصر لنتائج البحث"
            />
          </div>

          <div className="form-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              <span>نشر الصفحة وإتاحتها للزوار فوراً</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
