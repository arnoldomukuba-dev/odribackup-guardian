import React, { useEffect, useState } from 'react';
import { History, Filter, AlertCircle, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const BackupRuns = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/backup-runs', { params });
      setRuns(res.data);
    } catch (err) {
      console.error('Failed to fetch backup runs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [statusFilter]);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Backup Execution Runs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete audit trail of backup task executions, timing, size, and error logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Running">Running</option>
            <option value="Overdue">Overdue</option>
            <option value="Missed">Missed</option>
          </select>
        </div>
      </div>

      {/* Runs Table */}
      <Card>
        {loading ? (
          <Spinner size="lg" className="h-48" />
        ) : runs.length === 0 ? (
          <EmptyState
            title="No execution history found"
            description="Backup run execution records will appear here as scheduled jobs trigger."
            icon={History}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Run ID & Job</th>
                  <th className="px-4 py-3.5">Server</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Execution Time</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Archive Size</th>
                  <th className="px-4 py-3.5">Backup Location / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold font-mono text-slate-900 dark:text-slate-100">#{run.id}</p>
                      <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">{run.job_name || `Job #${run.job_id}`}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{run.server?.name || 'Server'}</p>
                      <p className="text-slate-400 font-mono">{run.server?.host_ip}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {run.status === 'Success' && <Badge variant="success">Success</Badge>}
                      {run.status === 'Failed' && <Badge variant="failed">Failed</Badge>}
                      {run.status === 'Running' && <Badge variant="info">Running</Badge>}
                      {run.status === 'Overdue' && <Badge variant="warning">Overdue</Badge>}
                      {run.status === 'Missed' && <Badge variant="warning">Missed</Badge>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(run.start_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {run.duration_seconds}s
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {formatBytes(run.size_bytes)}
                    </td>
                    <td className="px-4 py-3.5 text-xs max-w-xs truncate">
                      {run.error_message ? (
                        <span className="text-rose-500 font-mono font-medium" title={run.error_message}>
                          ⚠️ {run.error_message}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-500 dark:text-slate-400" title={run.backup_location}>
                          {run.backup_location || 'N/A'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BackupRuns;
