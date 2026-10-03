import React, { useEffect, useState } from 'react';
import { Database, Plus, Search, Play, ToggleLeft, ToggleRight, Edit, Clock, Server } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

const BackupJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [runningJobId, setRunningJobId] = useState(null);

  const { hasRole } = useAuth();
  const canEdit = hasRole(['ADMINISTRATOR', 'OPERATOR']);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    server_id: '',
    backup_type: 'Full',
    schedule_cron: '0 2 * * *',
    schedule_human: 'Daily at 02:00 UTC',
    destination: 's3://odri-backups-bucket/',
    retention_days: 30,
    status: 'Active',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, serversRes] = await Promise.all([
        api.get('/backups', { params: search ? { search } : {} }),
        api.get('/servers'),
      ]);
      setJobs(jobsRes.data);
      setServers(serversRes.data);
      if (serversRes.data.length > 0 && !formData.server_id) {
        setFormData((prev) => ({ ...prev, server_id: serversRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load backup jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setFormData({
      name: '',
      server_id: servers[0]?.id || '',
      backup_type: 'Full',
      schedule_cron: '0 2 * * *',
      schedule_human: 'Daily at 02:00 UTC',
      destination: 's3://odri-backups-bucket/',
      retention_days: 30,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
    setFormData({
      name: job.name,
      server_id: job.server_id,
      backup_type: job.backup_type,
      schedule_cron: job.schedule_cron,
      schedule_human: job.schedule_human || job.schedule_cron,
      destination: job.destination,
      retention_days: job.retention_days,
      status: job.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await api.put(`/backups/${editingJob.id}`, formData);
      } else {
        await api.post('/backups', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save job');
    }
  };

  const handleToggle = async (jobId) => {
    try {
      await api.post(`/backups/${jobId}/toggle`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Toggle status failed');
    }
  };

  const handleRunNow = async (jobId) => {
    try {
      setRunningJobId(jobId);
      await api.post(`/backups/${jobId}/run`);
      alert('Manual backup execution triggered successfully! Backup Run record generated.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to trigger backup execution');
    } finally {
      setRunningJobId(null);
    }
  };

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
            Backup Job Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure automated backup schedules, retention policies, and storage targets
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Backup Job</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search backup job name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
          />
        </div>
      </Card>

      {/* Job Table */}
      <Card>
        {loading ? (
          <Spinner size="lg" className="h-48" />
        ) : jobs.length === 0 ? (
          <EmptyState
            title="No backup jobs configured"
            description="Create your first automated backup job to protect infrastructure."
            icon={Database}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Job Name & Server</th>
                  <th className="px-4 py-3.5">Backup Type</th>
                  <th className="px-4 py-3.5">Schedule</th>
                  <th className="px-4 py-3.5">Target Destination</th>
                  <th className="px-4 py-3.5">Retention</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Run / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{job.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            <span>{job.server?.name || `Server #${job.server_id}`}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="purple">{job.backup_type}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{job.schedule_human || job.schedule_cron}</p>
                      <p className="font-mono text-slate-400 text-[11px]">{job.schedule_cron}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300 truncate max-w-xs">
                      {job.destination}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      {job.retention_days} Days
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => canEdit && handleToggle(job.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                          job.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {job.status === 'Active' ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleRunNow(job.id)}
                            disabled={runningJobId === job.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                            title="Execute Backup Now"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>{runningJobId === job.id ? 'Running...' : 'Run Now'}</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(job)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                            title="Edit Backup Job"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Job Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJob ? 'Edit Backup Job' : 'Create New Backup Job'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Job Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              placeholder="e.g. Daily PostgreSQL Database Dump"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Target Server *
              </label>
              <select
                required
                value={formData.server_id}
                onChange={(e) => setFormData({ ...formData, server_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              >
                {servers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.host_ip})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Backup Type *
              </label>
              <select
                value={formData.backup_type}
                onChange={(e) => setFormData({ ...formData, backup_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              >
                <option value="Full">Full Backup</option>
                <option value="Incremental">Incremental Backup</option>
                <option value="Differential">Differential Backup</option>
                <option value="Snapshot">Storage Snapshot</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Cron Schedule expression *
              </label>
              <input
                type="text"
                required
                value={formData.schedule_cron}
                onChange={(e) => setFormData({ ...formData, schedule_cron: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
                placeholder="0 2 * * *"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Human Readable Schedule
              </label>
              <input
                type="text"
                value={formData.schedule_human}
                onChange={(e) => setFormData({ ...formData, schedule_human: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                placeholder="e.g. Every day at 02:00 UTC"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Destination Path / S3 URI *
              </label>
              <input
                type="text"
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono"
                placeholder="s3://my-backup-bucket/path/"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Retention Days *
              </label>
              <input
                type="number"
                required
                min="1"
                max="3650"
                value={formData.retention_days}
                onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-md"
            >
              {editingJob ? 'Save Changes' : 'Create Job'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BackupJobs;
