import React, { useEffect, useState } from 'react';
import {
  Server,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import api from '../api/axios';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('Failed to connect to backend server. Make sure FastAPI API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return <Spinner size="lg" className="h-64" />;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchStats}
          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const healthColors = {
    Healthy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Infrastructure Backup Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time backup health monitoring and server compliance status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold ${healthColors[stats.overall_health]}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
            <span>System Health: {stats.overall_health}</span>
          </div>
          <button
            onClick={fetchStats}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Servers */}
        <Card className="hover:border-sky-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Servers
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {stats.total_servers}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                {stats.active_servers} Active Servers
              </p>
            </div>
            <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Total Backup Jobs */}
        <Card className="hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Backup Jobs
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {stats.total_jobs}
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                {stats.active_jobs} Enabled Jobs
              </p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Success Rate */}
        <Card className="hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Backup Success Rate
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.success_rate}%
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {stats.successful_backups} Successful Backups
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Failed & Overdue */}
        <Card className="hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Failed / Overdue
              </p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {stats.failed_backups + stats.overdue_backups}
              </h3>
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {stats.failed_backups} Failed • {stats.overdue_backups} Overdue
              </p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Status Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Successful</span>
          <Badge variant="success">{stats.successful_backups}</Badge>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Failed</span>
          <Badge variant="failed">{stats.failed_backups}</Badge>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue / Missed</span>
          <Badge variant="warning">{stats.overdue_backups + stats.missed_backups}</Badge>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Running Now</span>
          <Badge variant="info">{stats.running_backups}</Badge>
        </div>
      </div>

      {/* Recent Activity Table & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table (2 cols) */}
        <Card className="lg:col-span-2" title="Recent Backup Executions">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Server & Job</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Start Time</th>
                  <th className="px-4 py-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {stats.recent_activity.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{run.job_name || 'Backup Job'}</p>
                      <p className="text-xs text-slate-400">{run.server?.name || 'Server'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {run.status === 'Success' && <Badge variant="success">Success</Badge>}
                      {run.status === 'Failed' && <Badge variant="failed">Failed</Badge>}
                      {run.status === 'Running' && <Badge variant="info">Running</Badge>}
                      {run.status === 'Overdue' && <Badge variant="warning">Overdue</Badge>}
                      {run.status === 'Missed' && <Badge variant="warning">Missed</Badge>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(run.start_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono">
                      {run.duration_seconds}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Active Alerts Widget */}
        <Card title="Active System Alerts">
          {stats.recent_alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p>No active unacknowledged alerts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recent_alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {alert.title}
                    </span>
                    <Badge
                      variant={
                        alert.severity === 'Critical'
                          ? 'failed'
                          : alert.severity === 'High'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
