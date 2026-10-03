import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Search, ShieldAlert, Check } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ total: 0, unacknowledged: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [ackFilter, setAckFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { hasRole } = useAuth();
  const canAck = hasRole(['ADMINISTRATOR', 'OPERATOR']);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (ackFilter !== '') params.is_acknowledged = ackFilter === 'true';

      const [alertsRes, summaryRes] = await Promise.all([
        api.get('/alerts', { params }),
        api.get('/alerts/summary'),
      ]);
      setAlerts(alertsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, severityFilter, ackFilter]);

  const handleOpenAckModal = (alert) => {
    setSelectedAlert(alert);
    setResolutionNote('');
    setIsModalOpen(true);
  };

  const handleAcknowledge = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    try {
      await api.post(`/alerts/${selectedAlert.id}/acknowledge`, {
        resolution_note: resolutionNote,
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Acknowledgment failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Alerts & Notifications Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Infrastructure backup failure notifications, missed run alerts, and verification alerts
        </p>
      </div>

      {/* Severity Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">Critical Alerts</p>
            <h3 className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">{summary.critical}</h3>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">High Severity</p>
            <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{summary.high}</h3>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>

        <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase">Medium / Low</p>
            <h3 className="text-2xl font-bold text-sky-700 dark:text-sky-300 mt-1">{summary.medium + summary.low}</h3>
          </div>
          <AlertTriangle className="w-6 h-6 text-sky-500" />
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Total Unack</p>
            <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{summary.unacknowledged}</h3>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search alert title or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={ackFilter}
              onChange={(e) => setAckFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="false">Unacknowledged Only</option>
              <option value="true">Acknowledged Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Alerts Table */}
      <Card>
        {loading ? (
          <Spinner size="lg" className="h-48" />
        ) : alerts.length === 0 ? (
          <EmptyState
            title="No alerts found"
            description="System is operating smoothly with no triggered alerts."
            icon={CheckCircle}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Severity</th>
                  <th className="px-4 py-3.5">Alert Title</th>
                  <th className="px-4 py-3.5">Server</th>
                  <th className="px-4 py-3.5">Triggered At</th>
                  <th className="px-4 py-3.5">Status</th>
                  {canAck && <th className="px-4 py-3.5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          alert.severity === 'Critical'
                            ? 'failed'
                            : alert.severity === 'High'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{alert.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{alert.message}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      {alert.server?.name || 'System Wide'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      {alert.is_acknowledged ? (
                        <Badge variant="success" size="sm">Acknowledged</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Active</Badge>
                      )}
                    </td>
                    {canAck && (
                      <td className="px-4 py-3.5 text-right">
                        {!alert.is_acknowledged && (
                          <button
                            onClick={() => handleOpenAckModal(alert)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 ml-auto"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Acknowledge</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Acknowledge Alert Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Acknowledge Alert"
      >
        {selectedAlert && (
          <form onSubmit={handleAcknowledge} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{selectedAlert.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedAlert.message}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Resolution Note / Remediation Step *
              </label>
              <textarea
                required
                rows="3"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                placeholder="Describe action taken to resolve or investigate..."
              />
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
                Confirm Acknowledgment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Alerts;
