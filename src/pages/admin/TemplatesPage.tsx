import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface TemplateItem {
  id: number;
  key: string;
  type: string;
  title: string;
  content: string;
  channels: string;
  variables: string;
  version: number;
  updatedAt: string;
}

export const TemplatesPage: React.FC = () => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('welcome');
  const [activeTemplate, setActiveTemplate] = useState<TemplateItem | null>(null);

  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channels, setChannels] = useState('email,inapp');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load templates list
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listTemplates();
      if (res.data) {
        setTemplates(res.data);
        const initial = res.data.find((t) => t.key === selectedKey) || res.data[0];
        if (initial) {
          selectTemplate(initial);
        }
      }
    } catch {
      showToast('تعذر تحميل قوالب النظام', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const selectTemplate = (tpl: TemplateItem) => {
    setSelectedKey(tpl.key);
    setActiveTemplate(tpl);
    setTitle(tpl.title || '');
    setContent(tpl.content || '');
    setChannels(tpl.channels || 'email,inapp');
  };

  const handleSelectChange = (key: string) => {
    const found = templates.find((t) => t.key === key);
    if (found) selectTemplate(found);
  };

  // Variable chip click -> insert token into textarea
  const handleInsertVariable = (varName: string) => {
    const token = `{{${varName}}}`;
    setContent((prev) => prev + ' ' + token);
  };

  // Save changes
  const handleSave = async () => {
    if (!activeTemplate) return;
    setIsSaving(true);
    try {
      const res = await adminApi.updateTemplate(activeTemplate.key, {
        title,
        content,
        channels,
      });
      showToast(res.message || 'تم حفظ القالب بنجاح', 'success');
      setTemplates((prev) =>
        prev.map((t) =>
          t.key === activeTemplate.key
            ? { ...t, title, content, channels, version: t.version + 1 }
            : t
        )
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || 'فشل حفظ القالب', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Render mock preview
  const getRenderedPreview = () => {
    if (!content) return '';
    let rendered = content
      .replace(/\{\{user\.name\}\}/g, 'أحمد المنصوري')
      .replace(/\{\{user\.firstName\}\}/g, 'أحمد')
      .replace(/\{\{user\.email\}\}/g, 'ahmed@enterprise.local')
      .replace(/\{\{appName\}\}/g, 'Enterprise Core')
      .replace(/\{\{resetUrl\}\}/g, 'https://enterprise.local/reset-password?token=mock_xyz123')
      .replace(/\{\{verifyUrl\}\}/g, 'https://enterprise.local/verify-email?token=mock_abc456')
      .replace(/\{\{actionUrl\}\}/g, 'https://enterprise.local/user')
      .replace(/\{\{orderId\}\}/g, '#ORD-99824')
      .replace(/\{\{amount\}\}/g, '$450.00')
      .replace(/\{\{reason\}\}/g, 'تكرار محاولات الدخول الخاطئة')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('ar-EG'));

    return rendered;
  };

  const parseVariables = (varsString?: string): string[] => {
    if (!varsString) return ['user.name', 'user.email', 'appName', 'actionUrl'];
    try {
      const parsed = JSON.parse(varsString);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return varsString.split(',').map((s) => s.trim());
    }
    return ['user.name', 'user.email', 'appName'];
  };

  return (
    <div className="admin-page">
      <div className="page-title-bar">
        <div>
          <h2>محرر قوالب النظام والتنبيهات (Appendix A.7)</h2>
          <p className="text-muted">تحرير قوالب البريد الإلكتروني، إشعارات التطبيق، والرسائل النصية مع المعاينة الفورية</p>
        </div>
        <div className="title-actions">
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            💾 حفظ القالب
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="page-loader">
          <div className="spinner-large" />
        </div>
      ) : (
        <div className="templates-layout">
          {/* Template Selector Ribbon */}
          <div className="template-pills-bar">
            {templates.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                className={`template-pill-btn ${tpl.key === selectedKey ? 'active' : ''}`}
                onClick={() => handleSelectChange(tpl.key)}
              >
                <span className="pill-title">{tpl.title || tpl.key}</span>
                <span className="pill-key">{tpl.key}</span>
              </button>
            ))}
          </div>

          {/* Split View Editor */}
          {activeTemplate && (
            <div className="split-editor-grid mt-4">
              {/* Left Column: Code & Variable Chips */}
              <div className="editor-pane">
                <div className="pane-header">
                  <h3>تعديل محتوى القالب: <code>{activeTemplate.key}</code></h3>
                  <div className="pane-channels">
                    {channels.split(',').map((ch) => (
                      <Badge key={ch} variant="info">{ch.trim()}</Badge>
                    ))}
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">عنوان القالب / موضوع البريد</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Variable Chips (Click to insert) */}
                <div className="variables-box mb-3">
                  <span className="variables-title">المتغيرات الديناميكية المتاحة (انقر للإدراج):</span>
                  <div className="chips-list">
                    {parseVariables(activeTemplate.variables).map((v) => (
                      <button
                        key={v}
                        type="button"
                        className="variable-chip"
                        onClick={() => handleInsertVariable(v)}
                        title={`إدراج {{${v}}}`}
                      >
                        + {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">نص القالب (دعم المتغيرات والوسوم):</label>
                  <textarea
                    rows={12}
                    className="form-input font-mono template-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="اكتب نص القالب هنا..."
                  />
                </div>

                <div className="editor-footer-hint text-muted">
                  <small>ملاحظة: المتغيرات بصيغة <code>{`{{variable}}`}</code> تُستبدل تلقائياً بقيم المستخدم الحقيقية وقت الإرسال.</small>
                </div>
              </div>

              {/* Right Column: Live Rendered Preview */}
              <div className="preview-pane">
                <div className="pane-header">
                  <h3>معاينة حية للقالب (Live Preview)</h3>
                  <Badge variant="success">بيانات محاكاة</Badge>
                </div>

                <div className="email-preview-card">
                  <div className="preview-email-header">
                    <div className="preview-field">
                      <span className="text-muted">الموضوع:</span>
                      <strong>{title || 'بدون موضوع'}</strong>
                    </div>
                    <div className="preview-field">
                      <span className="text-muted">المستلم:</span>
                      <span>أحمد المنصوري &lt;ahmed@enterprise.local&gt;</span>
                    </div>
                  </div>

                  <div className="preview-email-body">
                    <div className="preview-brand-banner">
                      🏛️ المنظومة المؤسسية الموحدة
                    </div>

                    <div className="preview-content-rendered">
                      {getRenderedPreview().split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>

                    <div className="preview-email-footer">
                      <p>تم إرسال هذا الإشعار تلقائياً من خادم المؤسسة الآمن.</p>
                      <p>© {new Date().getFullYear()} جميع الحقوق محفوظة.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
