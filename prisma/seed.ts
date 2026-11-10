import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seed(): Promise<void> {
  console.log('[Seed] Starting Appendix A compliant idempotent seeding...');

  // 1. All Granular Permissions from A.1.1
  const permissionsData = [
    // users
    { slug: 'users.read', module: 'users', description: 'عرض قائمة وتفاصيل المستخدمين' },
    { slug: 'users.create', module: 'users', description: 'إنشاء مستخدم جديد' },
    { slug: 'users.update', module: 'users', description: 'تعديل بيانات وحالة المستخدم' },
    { slug: 'users.delete', module: 'users', description: 'حذف أو تعطيل المستخدم (Soft Delete)' },
    { slug: 'users.export', module: 'users', description: 'تصدير بيانات المستخدمين (CSV/Excel)' },
    { slug: 'users.impersonate', module: 'users', description: 'انتحال هوية مستخدم آخر (Super Admin فقط)' },
    // roles
    { slug: 'roles.read', module: 'roles', description: 'استعراض الأدوار الوظيفية' },
    { slug: 'roles.create', module: 'roles', description: 'إنشاء دور وظيفي جديد' },
    { slug: 'roles.update', module: 'roles', description: 'تعديل اسم وصلاحيات الدور' },
    { slug: 'roles.delete', module: 'roles', description: 'حذف الأدوار المخصصة غير المستخدمة' },
    { slug: 'roles.assign', module: 'roles', description: 'تعيين الأدوار للمستخدمين' },
    // permissions
    { slug: 'permissions.read', module: 'permissions', description: 'استعراض مصفوفة الصلاحيات' },
    { slug: 'permissions.assign', module: 'permissions', description: 'ربط الصلاحيات بالأدوار' },
    // pages
    { slug: 'pages.read', module: 'pages', description: 'استعراض الصفحات العامة المدارة' },
    { slug: 'pages.create', module: 'pages', description: 'إنشاء صفحة عامة جديدة' },
    { slug: 'pages.update', module: 'pages', description: 'تعديل محتوى الصفحة وعلامات SEO' },
    { slug: 'pages.delete', module: 'pages', description: 'حذف أو إلغاء نشر الصفحة' },
    { slug: 'pages.publish', module: 'pages', description: 'تغيير حالة النشر (مسودة / منشورة)' },
    // settings
    { slug: 'settings.read', module: 'settings', description: 'عرض إعدادات النظام' },
    { slug: 'settings.write', module: 'settings', description: 'تعديل الإعدادات العامة والبيئة' },
    { slug: 'settings.secrets', module: 'settings', description: 'تعديل وتدوير مفاتيح الأسرار المشفرة' },
    // notifications
    { slug: 'notifications.read', module: 'notifications', description: 'عرض الإشعارات المرسلة' },
    { slug: 'notifications.write', module: 'notifications', description: 'إنشاء مسودات الإشعارات' },
    { slug: 'notifications.send', module: 'notifications', description: 'إرسال وتوجيه الإشعارات عبر القنوات' },
    { slug: 'notifications.templates', module: 'notifications', description: 'إدارة قوالب الإشعارات' },
    // templates
    { slug: 'templates.read', module: 'templates', description: 'عرض قوالب البريد والفواتير والتقارير' },
    { slug: 'templates.write', module: 'templates', description: 'تعديل وتخصيص القوالب وحفظ النسخ' },
    // media
    { slug: 'media.read', module: 'media', description: 'استعراض مكتبة الوسائط والملفات' },
    { slug: 'media.upload', module: 'media', description: 'رفع ملفات ووسائط جديدة' },
    { slug: 'media.delete', module: 'media', description: 'حذف الملفات المرفوعة' },
    // backups
    { slug: 'backups.read', module: 'backups', description: 'استعراض النسخ الاحتياطية المتوفرة' },
    { slug: 'backups.create', module: 'backups', description: 'إنشاء نسخة احتياطية جديدة فورية' },
    { slug: 'backups.restore', module: 'backups', description: 'استعادة النظام من نسخة سابقة (بتأكيد مزدوج)' },
    { slug: 'backups.delete', module: 'backups', description: 'حذف النسخ الاحتياطية القديمة' },
    // audit
    { slug: 'audit.read', module: 'audit', description: 'استعراض سجلات التدقيق الأمني' },
    { slug: 'audit.export', module: 'audit', description: 'تصدير سجلات التدقيق بصيغة CSV' },
    // system
    { slug: 'system.health', module: 'system', description: 'فحص صحة الخادم وقاعدة البيانات' },
    { slug: 'system.manage', module: 'system', description: 'إدارة الجلسات والـ Cache ووضع الصيانة' },
    { slug: 'system.reset', module: 'system', description: 'إعادة ضبط المصنع للنظام (Factory Reset)' },
    // services
    { slug: 'services.email', module: 'services', description: 'إدارة واختبار خوادم SMTP' },
    { slug: 'services.sms', module: 'services', description: 'إدارة واختبار بوابة Twilio SMS' },
    { slug: 'services.whatsapp', module: 'services', description: 'إدارة واختبار Meta WhatsApp API' },
    { slug: 'services.paypal', module: 'services', description: 'إدارة واختبار بوابة PayPal' },
    { slug: 'services.test', module: 'services', description: 'تشغيل الفحوصات التشخيصية الشاملة' },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: { description: perm.description, module: perm.module },
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const permissionsMap = new Map(allPermissions.map((p) => [p.slug, p.id]));

  // 2. Default Roles according to A.1.2:
  // super_admin -> all
  // admin -> all except: system.reset, settings.secrets, users.impersonate, backups.restore
  // editor -> pages.*, media.read, media.upload, templates.read, notifications.read
  // user -> personal account
  const excludedFromAdmin = ['system.reset', 'settings.secrets', 'users.impersonate', 'backups.restore'];
  const adminPermissions = allPermissions
    .filter((p) => !excludedFromAdmin.includes(p.slug))
    .map((p) => p.slug);

  const editorPermissions = [
    'pages.read',
    'pages.create',
    'pages.update',
    'pages.delete',
    'pages.publish',
    'media.read',
    'media.upload',
    'templates.read',
    'notifications.read',
  ];

  const rolesData = [
    {
      name: 'مدير النظام الأعلى',
      slug: 'super_admin',
      description: 'كامل الصلاحيات والامتيازات المؤسسية بما فيها إعادة الضبط وانتحال الهوية',
      isSystem: true,
      permissions: allPermissions.map((p) => p.slug),
    },
    {
      name: 'مدير إداري',
      slug: 'admin',
      description: 'كامل الإدارة والعمليات عدا استعادة النسخ، كشف الأسرار، وإعادة الضبط',
      isSystem: true,
      permissions: adminPermissions,
    },
    {
      name: 'محرر محتوى',
      slug: 'editor',
      description: 'إدارة المحتوى، الصفحات العامة، الوسائط، وقوالب النشر',
      isSystem: true,
      permissions: editorPermissions,
    },
    {
      name: 'مستخدم مسجل',
      slug: 'user',
      description: 'مستخدم نظام عادي يستعرض حسابه وخدماته الشخصية فقط',
      isSystem: true,
      permissions: [],
    },
  ];

  for (const r of rolesData) {
    const roleRecord = await prisma.role.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description, isSystem: r.isSystem },
      create: {
        name: r.name,
        slug: r.slug,
        description: r.description,
        isSystem: r.isSystem,
      },
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: roleRecord.id },
    });

    for (const permSlug of r.permissions) {
      const pId = permissionsMap.get(permSlug);
      if (pId) {
        await prisma.rolePermission.create({
          data: {
            roleId: roleRecord.id,
            permissionId: pId,
          },
        });
      }
    }
  }

  // 3. Default System Templates from A.7.4 & A.8
  const defaultTemplates = [
    {
      key: 'welcome',
      type: 'notification',
      title: 'مرحباً بك في المنظومة المؤسسية',
      content: 'أهلاً بك {{user.name}}! يسعدنا انضمامك إلى نظام Enterprise. لقد تم تفعيل حسابك بنجاح.',
      channels: 'email,inapp',
      isSystem: true,
    },
    {
      key: 'password_reset',
      type: 'notification',
      title: 'طلب استعادة كلمة المرور',
      content: 'مرحباً {{user.name}}، لقد تم طلب إعادة تعيين كلمة المرور لحسابك. استخدم الرابط التالي: {{resetUrl}}',
      channels: 'email,sms',
      isSystem: true,
    },
    {
      key: 'email_verification',
      type: 'notification',
      title: 'رمز التحقق وتأكيد البريد',
      content: 'رمز التحقق الخاص بحسابك هو: {{code}}. الرمز صالح لمدة 15 دقيقة فقط.',
      channels: 'email,sms',
      isSystem: true,
    },
    {
      key: 'account_suspended',
      type: 'notification',
      title: 'إشعار أمني: تم إيقاف الحساب',
      content: 'عزيزي {{user.name}}، تم إيقاف حسابك مؤقتاً لأسباب تتعلق بالأمان أو تجاوز السياسات. يرجى التواصل مع الإدارة.',
      channels: 'email,inapp',
      isSystem: true,
    },
    {
      key: 'order_confirmation',
      type: 'notification',
      title: 'تأكيد استلام الطلب',
      content: 'تم تسجيل طلبك رقم {{order.id}} بنجاح بإجمالي مبلغ {{order.total}}.',
      channels: 'email,sms,whatsapp',
      isSystem: true,
    },
    {
      key: 'payment_success',
      type: 'notification',
      title: 'إيصال سداد إلكتروني',
      content: 'تم استلام الدفعة المالية بنجاح عبر بوابة {{payment.gateway}}. رقم العملية: {{payment.transactionId}}.',
      channels: 'email,inapp',
      isSystem: true,
    },
    {
      key: 'invoice_standard',
      type: 'invoice',
      title: 'قالب الفاتورة الضريبية القياسية',
      content: `
<div style="font-family: Arial, sans-serif; padding: 24px; direction: rtl; text-align: right;">
  <div style="border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px;">
    <h2>فاتورة ضريبية رسمية</h2>
    <p>رقم الفاتورة: <strong>{{invoice.number}}</strong> | التاريخ: <strong>{{invoice.date}}</strong></p>
  </div>
  <p>العميل: <strong>{{customer.name}}</strong> ({{customer.email}})</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
    <thead>
      <tr style="background: #f1f5f9;">
        <th style="padding: 10px; border: 1px solid #cbd5e1;">الوصف</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">الكمية</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">السعر</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1;">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">اشتراك ترخيص المؤسسة</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">1</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">$500.00</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">$500.00</td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top: 24px; text-align: left;">
    <h3>المجموع الكلي: {{total}}</h3>
  </div>
</div>`,
      channels: 'email',
      isSystem: true,
    },
    {
      key: 'report_users_summary',
      type: 'report',
      title: 'تقرير ملخص المستخدمين والنشاط',
      content: 'SELECT id, email, firstName, lastName, status, createdAt FROM User WHERE deletedAt IS NULL LIMIT 100;',
      channels: 'inapp',
      isSystem: true,
    },
  ];

  for (const t of defaultTemplates) {
    await prisma.template.upsert({
      where: { key: t.key },
      update: {
        title: t.title,
        content: t.content,
        type: t.type,
        channels: t.channels,
        isSystem: t.isSystem,
      },
      create: t,
    });
  }

  // 4. Default System Settings (12 Groups) with Appendix A fields
  const defaultSettings = [
    // 1. general
    { key: 'general.site_name', value: 'نظام Enterprise المتكامل', group: 'general', isSecret: false, description: 'اسم المنصة العام' },
    { key: 'general.site_url', value: 'http://localhost:3000', group: 'general', isSecret: false, description: 'الرابط الأساسي للموقع' },
    { key: 'general.site_description', value: 'منصة برمجية مؤسسية لإدارة العمليات والصلاحيات والخدمات السحابية', group: 'general', isSecret: false, description: 'الوصف التعريفي العام' },
    { key: 'general.default_locale', value: 'ar', group: 'general', isSecret: false, description: 'اللغة الافتراضية' },
    { key: 'general.timezone', value: 'Asia/Riyadh', group: 'general', isSecret: false, description: 'المنطقة الزمنية الرسمية' },
    { key: 'general.support_email', value: 'support@enterprise.local', group: 'general', isSecret: false, description: 'بريد الدعم والمساعدة' },
    { key: 'general.support_phone', value: '+966110000000', group: 'general', isSecret: false, description: 'هاتف الدعم المباشر' },
    { key: 'general.company_address', value: 'الرياض، مركز الأعمال التقنية', group: 'general', isSecret: false, description: 'العنوان الرسمي للمقر' },
    { key: 'general.social_twitter', value: 'https://twitter.com/enterprise', group: 'general', isSecret: false, description: 'رابط تويتر / X' },
    { key: 'general.maintenance_mode', value: 'false', group: 'general', isSecret: false, description: 'وضع الصيانة (تفعيل/تعطيل)' },
    { key: 'general.maintenance_message', value: 'المنظومة تحت الصيانة المجدولة حالياً. سنعود قريباً.', group: 'general', isSecret: false, description: 'رسالة وضع الصيانة' },
    { key: 'general.registration_open', value: 'true', group: 'general', isSecret: false, description: 'السماح بتسجيل المستخدمين الجدد' },
    // 2. env
    { key: 'env.node_env', value: 'development', group: 'env', isSecret: false, description: 'بيئة تشغيل Node.js' },
    { key: 'env.port', value: '3000', group: 'env', isSecret: false, description: 'منفذ الاستماع' },
    { key: 'env.app_url', value: 'http://localhost:3000', group: 'env', isSecret: false, description: 'رابط التطبيق الداخلي' },
    // 3. database
    { key: 'database.engine', value: 'SQLite / Prisma ORM', group: 'database', isSecret: false, description: 'محرك قاعدة البيانات' },
    { key: 'database.pool_size', value: '10', group: 'database', isSecret: false, description: 'سعة مجمع الاتصالات المتزامنة' },
    // 4. email
    { key: 'email.enabled', value: 'true', group: 'email', isSecret: false, description: 'تفعيل إرسال البريد' },
    { key: 'email.smtp_host', value: 'smtp.mailtrap.io', group: 'email', isSecret: false, description: 'خادم البريد الصادر SMTP' },
    { key: 'email.smtp_port', value: '587', group: 'email', isSecret: false, description: 'منفذ خادم SMTP' },
    { key: 'email.smtp_user', value: 'enterprise_mailer', group: 'email', isSecret: false, description: 'اسم مستخدم SMTP' },
    { key: 'email.smtp_pass', value: 'mock_encrypted_secret_pass', group: 'email', isSecret: true, description: 'كلمة مرور SMTP مشفرة' },
    { key: 'email.from_email', value: 'no-reply@enterprise.local', group: 'email', isSecret: false, description: 'بريد الإرسال المعتمد' },
    { key: 'email.from_name', value: 'Enterprise Mailer', group: 'email', isSecret: false, description: 'اسم المرسل الظاهر' },
    // 5. sms
    { key: 'sms.enabled', value: 'true', group: 'sms', isSecret: false, description: 'تفعيل خدمة الرسائل القصيرة SMS' },
    { key: 'sms.provider', value: 'twilio', group: 'sms', isSecret: false, description: 'مزود الخدمة المعتمد' },
    { key: 'sms.twilio_account_sid', value: 'AC_MOCK_ACCOUNT_SID_ENTERPRISE', group: 'sms', isSecret: false, description: 'معرف حساب Twilio' },
    { key: 'sms.twilio_auth_token', value: 'mock_twilio_auth_token_secret', group: 'sms', isSecret: true, description: 'رمز تفويض Twilio مشفر' },
    { key: 'sms.twilio_from_number', value: '+1234567890', group: 'sms', isSecret: false, description: 'رقم الإرسال المعتمد' },
    { key: 'sms.daily_limit', value: '500', group: 'sms', isSecret: false, description: 'الحد الأقصى للرسائل اليومية' },
    // 6. whatsapp
    { key: 'whatsapp.enabled', value: 'true', group: 'whatsapp', isSecret: false, description: 'تفعيل Meta WhatsApp API' },
    { key: 'whatsapp.meta_cloud_token', value: 'mock_meta_whatsapp_token_secret', group: 'whatsapp', isSecret: true, description: 'رمز واجهة Meta Cloud API مشفر' },
    { key: 'whatsapp.phone_number_id', value: '10987654321', group: 'whatsapp', isSecret: false, description: 'معرف رقم الهاتف المسجل في Meta' },
    { key: 'whatsapp.business_account_id', value: '98765432101', group: 'whatsapp', isSecret: false, description: 'معرف حساب الأعمال في Meta' },
    // 7. paypal
    { key: 'paypal.enabled', value: 'true', group: 'paypal', isSecret: false, description: 'تفعيل بوابة دفع PayPal' },
    { key: 'paypal.mode', value: 'sandbox', group: 'paypal', isSecret: false, description: 'وضع التشغيل (sandbox أو live)' },
    { key: 'paypal.client_id', value: 'PAYPAL_MOCK_CLIENT_ID_XYZ', group: 'paypal', isSecret: false, description: 'PayPal Client ID' },
    { key: 'paypal.client_secret', value: 'PAYPAL_MOCK_SECRET_KEY_ABC', group: 'paypal', isSecret: true, description: 'PayPal Client Secret مشفر' },
    { key: 'paypal.currency', value: 'USD', group: 'paypal', isSecret: false, description: 'العملة الافتراضية للمعاملات' },
    // 8. files
    { key: 'files.storage_driver', value: 'local', group: 'files', isSecret: false, description: 'مشغل التخزين (local أو s3)' },
    { key: 'files.upload_dir', value: 'uploads', group: 'files', isSecret: false, description: 'مجلد التخزين المحلي' },
    { key: 'files.upload_max_size_mb', value: '15', group: 'files', isSecret: false, description: 'الحد الأقصى لحجم الملف بالميغابايت' },
    { key: 'files.allowed_extensions', value: 'jpg,png,pdf,docx,xlsx', group: 'files', isSecret: false, description: 'الامتدادات المسموح بها' },
    { key: 'files.compression_quality', value: '85', group: 'files', isSecret: false, description: 'جودة ضغط الصور المرفوعة (1-100)' },
    // 9. css
    { key: 'css.primary_color', value: '#58a6ff', group: 'css', isSecret: false, description: 'اللون الأزرق الأساسي (#58a6ff)' },
    { key: 'css.secondary_color', value: '#bc8cff', group: 'css', isSecret: false, description: 'اللون البنفسجي الثانوي' },
    { key: 'css.bg_color', value: '#0d1117', group: 'css', isSecret: false, description: 'لون الخلفية الداكن' },
    { key: 'css.font_family', value: 'Cairo', group: 'css', isSecret: false, description: 'الخط العربي الأساسي (Cairo / Tajawal)' },
    { key: 'css.font_size', value: '16', group: 'css', isSecret: false, description: 'حجم الخط الأساسي بالبيكسل' },
    // 10. i18n
    { key: 'i18n.enabled_locales', value: 'ar,en,fr', group: 'i18n', isSecret: false, description: 'اللغات المتاحة في النظام' },
    { key: 'i18n.default_locale', value: 'ar', group: 'i18n', isSecret: false, description: 'اللغة الافتراضية' },
    { key: 'i18n.translations_json', value: '{"common.welcome":"مرحباً","common.save":"حفظ","common.cancel":"إلغاء"}', group: 'i18n', isSecret: false, description: 'قاموس الترجمات الموسع' },
    // 11. cloud
    { key: 'cloud.provider', value: 's3', group: 'cloud', isSecret: false, description: 'المزود السحابي (S3 / Cloudinary / R2)' },
    { key: 'cloud.s3_bucket', value: 'enterprise-app-assets', group: 'cloud', isSecret: false, description: 'اسم حاوية S3' },
    { key: 'cloud.s3_region', value: 'eu-west-1', group: 'cloud', isSecret: false, description: 'منطقة AWS S3' },
    { key: 'cloud.s3_access_key', value: 'AWS_ACCESS_KEY_MOCK', group: 'cloud', isSecret: false, description: 'مفتاح وصول AWS S3' },
    { key: 'cloud.s3_secret_key', value: 'AWS_SECRET_KEY_MOCK', group: 'cloud', isSecret: true, description: 'مفتاح سر AWS S3 مشفر' },
    // 12. secrets
    { key: 'secrets.jwt_secret_hash', value: '***', group: 'secrets', isSecret: true, description: 'مفتاح تشفير JWT Access Token' },
    { key: 'secrets.refresh_secret_hash', value: '***', group: 'secrets', isSecret: true, description: 'مفتاح تشفير Refresh Token' },
    { key: 'secrets.encryption_cipher', value: 'AES-256-GCM', group: 'secrets', isSecret: false, description: 'خوارزمية التشفير المعتمدة' },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { description: s.description, group: s.group, isSecret: s.isSecret },
      create: s,
    });
  }

  // 5. Default CMS Pages
  const defaultPages = [
    {
      slug: 'home',
      title: 'الرئيسية — بوابة Enterprise المؤسسية',
      content: 'مرحباً بكم في نظام Enterprise المتكامل. منصة متطورة لإدارة العمليات والصلاحيات والخدمات السحابية بأعلى معايير الأمان والكفاءة.',
      metaTitle: 'الرئيسية | Enterprise Core Platform',
      metaDescription: 'البوابة المؤسسية لإدارة المنظومة والخدمات السحابية المتكاملة.',
      metaKeywords: 'enterprise, system, rbac, security, cloud',
      order: 1,
      isPublished: true,
    },
    {
      slug: 'about',
      title: 'نبذة عنا — رؤيتنا وقيمنا',
      content: 'نحن نقدم بنية تحتية برمجية متقدمة مصممة للمؤسسات والشركات، مع التركيز على العزل الصارم، الأمان التام، وسهولة التوسع.',
      metaTitle: 'من نحن | Enterprise Platform',
      metaDescription: 'تعرف على رؤيتنا وأهدافنا في بناء أنظمة البرمجيات المؤسسية.',
      metaKeywords: 'about, company, mission, vision',
      order: 2,
      isPublished: true,
    },
    {
      slug: 'services',
      title: 'خدماتنا وحلولنا البرمجية',
      content: 'نوفر حلولاً شاملة تشمل إدارة المستخدمين والأدوار، تكامل بوابات الدفع، خوادم البريد، الرسائل النصية، والتخزين السحابي الآمن.',
      metaTitle: 'خدماتنا | حلول Enterprise متكاملة',
      metaDescription: 'استكشف قائمة الحلول والخدمات المؤسسية المتوفرة عبر النظام.',
      metaKeywords: 'services, email, sms, payment, cloud',
      order: 3,
      isPublished: true,
    },
    {
      slug: 'faq',
      title: 'الأسئلة الشائعة FAQ',
      content: 'هنا تجد إجابات على التساؤلات الأكثر شيوعاً حول إدارة الحسابات، سياسات الأمان، وتفعيل الخدمات الخارجية.',
      metaTitle: 'الأسئلة الشائعة | مساعدة ودعم',
      metaDescription: 'دليل الإجابات على الأسئلة الشائعة لجميع مستخدمي ومديري النظام.',
      metaKeywords: 'faq, questions, help, support',
      order: 4,
      isPublished: true,
    },
    {
      slug: 'terms',
      title: 'الشروط والأحكام وسياسة الخصوصية',
      content: 'تحدد هذه الوثيقة الشروط الحاكمة لاستخدام المنصة، وسياسات حماية البيانات وسجلات التدقيق المعتمدة وفق المعايير المؤسسية.',
      metaTitle: 'الشروط والأحكام | سياسة الخصوصية',
      metaDescription: 'الشروط والأحكام المعتمدة للاستخدام والخصوصية.',
      metaKeywords: 'terms, privacy, compliance',
      order: 5,
      isPublished: true,
    },
    {
      slug: 'contact',
      title: 'اتصل بنا — مركز الدعم المؤسسي',
      content: 'فريق الدعم الفني جاهز للإجابة على استفساراتك وتقديم المساعدة على مدار الساعة.',
      metaTitle: 'اتصل بنا | الدعم الفني',
      metaDescription: 'تواصل مع فريق الدعم الفني للمنصة لأي مساعدة أو استفسار.',
      metaKeywords: 'contact, support, inquiry',
      order: 6,
      isPublished: true,
    },
  ];

  for (const page of defaultPages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        content: page.content,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        metaKeywords: page.metaKeywords,
        order: page.order,
        isPublished: page.isPublished,
      },
      create: page,
    });
  }

  // 6. Ensure Super Admin exists
  const superAdminRole = await prisma.role.findUnique({ where: { slug: 'super_admin' } });
  if (superAdminRole) {
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { roleId: superAdminRole.id, deletedAt: null },
    });

    if (!existingSuperAdmin) {
      const defaultPasswordHash = await bcrypt.hash('Admin@Enterprise2026', 12);
      await prisma.user.create({
        data: {
          email: 'admin@enterprise.local',
          passwordHash: defaultPasswordHash,
          firstName: 'المدير',
          lastName: 'الأعلى',
          phone: '+966500000000',
          roleId: superAdminRole.id,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
      console.log('[Seed] Super Admin initialized: admin@enterprise.local');
    }
  }

  console.log('[Seed] Appendix A seeding completed successfully.');
}

if (process.env.NODE_ENV !== 'test') {
  seed()
    .catch((error) => {
      console.error('[Seed Error]', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
