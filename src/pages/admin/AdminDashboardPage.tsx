import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.api';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';

interface DashboardKPIs {
  totalUsers: { value: number; deltaPercent: number };
  activeUsers24h: { value: number };
  pendingUsers: { value: number };
  registrationsToday: { value: number };
  auditSensitive24h: { value: number };
}

interface DashboardCharts {
  registrations30Days: Array<{ date: string; count: number }>;
  roleDistribution: Array<{ name: string; slug: string; count: number }>;
  operationsSummary: Array<{ type: string; count: number }>;
  hourlyActivity: Array<{ minute: string; requests: number }>;
}

interface SmartAlert {
  id: string;
  level: 'danger' | 'warning' | 'info';
  message: string;
  actionTo?: string;
}

export const AdminDashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, chartsRes, alertsRes, logsRes] = await Promise.all([
        adminApi.getDashboardKPIs(),
        adminApi.getDashboardCharts(),
        adminApi.getSmartAlerts(),
        adminApi.listAuditLogs(1, 5),
      ]);

      if (kpiRes.data) setKpis(kpiRes.data);
      if (chartsRes.data) setCharts(chartsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
      if (logsRes.data) setRecentLogs(logsRes.data.items || []);
    } catch {
      showToast('تعذر تحميل بيانات لوحة المؤشرات', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute SVG Points for 30-day user registrations line chart
  const renderLineChart = () => {
    if (!charts || charts.registrations30Days.length === 0) return null;
    const data = charts.registrations30Days;
    const width = 680;
    const height = 200;
    const padding = 35;

    const maxCount = Math.max(...data.map((d) => d.count), 5);
    const minCount = 0;

    const getX = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);
    const getY = (value: number) => height - padding - ((value - minCount) / (maxCount - minCount)) * (height - 2 * padding);

    const pointsString = data.map((d, i) => `${getX(i)},${getY(d.count)}`).join(' ');

    return (
      <svg className="dashboard-svg-chart" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58a6ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#58a6ff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = height - padding - ratio * (height - 2 * padding);
          const val = Math.round(minCount + ratio * (maxCount - minCount));
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#30363d" strokeDasharray="3,3" />
              <text x={padding - 8} y={y + 4} fill="#8b949e" fontSize="11" textAnchor="end">
                {val}
              </text>
            </g>
          );
        })}

        {/* Fill area */}
        <polygon
          points={`${pointsString} ${width - padding},${height - padding} ${padding},${height - padding}`}
          fill="url(#chartGradient)"
        />

        {/* Trend line */}
        <polyline
          fill="none"
          stroke="#58a6ff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsString}
        />

        {/* Points & Labels */}
        {data.map((d, i) => {
          const showLabel = i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1;
          const cx = getX(i);
          const cy = getY(d.count);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="4" fill="#161b22" stroke="#58a6ff" strokeWidth="2" />
              {showLabel && (
                <text x={cx} y={height - 10} fill="#8b949e" fontSize="10" textAnchor="middle">
                  {d.date}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="admin-page">
      {/* Title & Top Actions */}
      <div className="page-title-bar">
        <div>
          <h2>لوحة المؤشرات والعمليات المركزية (Appendix A)</h2>
          <p className="text-muted">موجز فوري لأداء المؤسسة، الحسابات، التحليلات، ومصفوفة التنبيهات الذكية</p>
        </div>
        <div className="title-actions">
          <button type="button" onClick={fetchDashboardData} className="btn btn-outline btn-sm">
            🔄 تحديث المؤشرات
          </button>
          <Link to="/admin/notifications" className="btn btn-outline btn-sm">
            📣 إرسال إشعار
          </Link>
          <Link to="/admin/users" className="btn btn-primary btn-sm">
            👥 إدارة المستخدمين
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="page-loader">
          <div className="spinner-large" />
          <p className="mt-3 text-muted">جاري تحميل لوحة المؤشرات المركزية...</p>
        </div>
      ) : (
        <>
          {/* Smart Alerts Bar (Appendix A.2) */}
          {alerts.length > 0 && (
            <div className="smart-alerts-container mb-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`smart-alert-card alert-${alert.level}`}>
                  <div className="alert-content">
                    <span className="alert-icon">
                      {alert.level === 'danger' && '🚨'}
                      {alert.level === 'warning' && '⚠️'}
                      {alert.level === 'info' && 'ℹ️'}
                    </span>
                    <div>
                      <strong className="alert-title">تنبيه ذكي من المنظومة</strong>
                      <p className="alert-msg">{alert.message}</p>
                    </div>
                  </div>
                  {alert.actionTo && (
                    <Link to={alert.actionTo} className="btn btn-sm btn-outline alert-action-btn">
                      متابعة التنبيه ←
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 5 KPI Cards (Appendix A.2) */}
          {kpis && (
            <div className="kpi-grid">
              {/* Total Users */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-title">إجمالي المستخدمين</span>
                  <span className="kpi-icon bg-blue">👥</span>
                </div>
                <div className="kpi-body">
                  <span className="kpi-value">{kpis.totalUsers.value}</span>
                  <div className="kpi-delta text-success">
                    <span>معدل النمو الشهري</span>
                    <span className="delta-badge">+{kpis.totalUsers.deltaPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Active Users 24h */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-title">المستخدمون النشطون (24س)</span>
                  <span className="kpi-icon bg-green">🟢</span>
                </div>
                <div className="kpi-body">
                  <span className="kpi-value">{kpis.activeUsers24h.value}</span>
                  <div className="kpi-delta text-muted">
                    <span>جلسات تفاعلية نشطة</span>
                  </div>
                </div>
              </div>

              {/* Pending Users */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-title">بانتظار التفعيل (Pending)</span>
                  <span className="kpi-icon bg-amber">⏳</span>
                </div>
                <div className="kpi-body">
                  <span className="kpi-value">{kpis.pendingUsers.value}</span>
                  <div className="kpi-delta text-warning">
                    <span>{kpis.pendingUsers.value > 0 ? 'بحاجة لمراجعة المدير' : 'لا يوجد حسابات معلقة'}</span>
                  </div>
                </div>
              </div>

              {/* Today's Registrations */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-title">تسجيلات اليوم</span>
                  <span className="kpi-icon bg-purple">⚡</span>
                </div>
                <div className="kpi-body">
                  <span className="kpi-value">{kpis.registrationsToday.value}</span>
                  <div className="kpi-delta text-info">
                    <span>خلال اليوم الحالي</span>
                  </div>
                </div>
              </div>

              {/* Sensitive Audit Ops 24h */}
              <div className="kpi-card">
                <div className="kpi-header">
                  <span className="kpi-title">عمليات التدقيق (24س)</span>
                  <span className="kpi-icon bg-red">🛡️</span>
                </div>
                <div className="kpi-body">
                  <span className="kpi-value">{kpis.auditSensitive24h.value}</span>
                  <div className="kpi-delta text-muted">
                    <span>عمليات مصادقة وإدارة</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="charts-split-grid mt-4">
            {/* 30-Day Registrations Line Chart */}
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>اتجاه تسجيل المستخدمين (آخر 30 يوماً)</h3>
                  <p className="card-subtitle">معدل الانضمام اليومي للمنصة</p>
                </div>
                <span className="chart-badge">SVG مباشر</span>
              </div>
              <div className="chart-canvas-container">
                {renderLineChart()}
              </div>
            </div>

            {/* Role Distribution Chart */}
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>توزيع المستخدمين حسب الأدوار</h3>
                  <p className="card-subtitle">الهيكل الإداري والوظيفي للحسابات</p>
                </div>
                <Link to="/admin/roles" className="btn btn-ghost btn-sm">
                  الأدوار ←
                </Link>
              </div>
              <div className="roles-dist-container">
                {charts?.roleDistribution.map((r, idx) => {
                  const total = kpis?.totalUsers.value || 1;
                  const percent = Math.round((r.count / total) * 100);
                  const colors = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff'];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={r.slug} className="role-progress-item">
                      <div className="role-label-flex">
                        <strong>{r.name}</strong>
                        <span>{r.count} مستخدم ({percent}%)</span>
                      </div>
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${Math.max(percent, 4)}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Operations Summary & Recent Audit Streams */}
          <div className="dashboard-columns mt-4">
            {/* Operations Summary */}
            <div className="dashboard-card">
              <h3>العمليات حسب الوحدة النظامية</h3>
              <p className="card-subtitle">نشاط المنظومة الموزع على الوحدات التشغيلية</p>
              <div className="module-bars-list mt-3">
                {charts?.operationsSummary.map((m) => {
                  const maxCount = Math.max(...(charts.operationsSummary.map((x) => x.count) || [1]));
                  const percent = Math.round((m.count / (maxCount || 1)) * 100);
                  return (
                    <div key={m.type} className="module-bar-item">
                      <div className="bar-labels">
                        <code>{m.type.toUpperCase()}</code>
                        <span>{m.count} عملية</span>
                      </div>
                      <div className="progress-bar-track">
                        <div
                          className="progress-bar-fill bg-info"
                          style={{ width: `${Math.max(percent, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Audit Log Feed */}
            <div className="dashboard-card">
              <div className="card-header-flex">
                <div>
                  <h3>أحدث سجلات التدقيق الأمني</h3>
                  <p className="card-subtitle">العمليات الحساسة الموثقة لحظياً</p>
                </div>
                <Link to="/admin/audit-logs" className="btn btn-outline btn-sm">
                  السجلات الكاملة ←
                </Link>
              </div>
              <div className="recent-logs-list mt-3">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <div key={log.id} className="mini-log-item">
                      <div className="log-badge-col">
                        <Badge variant={log.action.includes('FAIL') || log.action.includes('DELETE') ? 'danger' : 'info'}>
                          {log.action}
                        </Badge>
                      </div>
                      <div className="log-details-col">
                        <span className="log-user">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'النظام'}
                        </span>
                        <span className="log-ip text-muted">({log.ipAddress || '127.0.0.1'})</span>
                      </div>
                      <div className="log-time-col text-muted">
                        {new Date(log.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">لا يوجد سجلات أمنية حديثة.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
