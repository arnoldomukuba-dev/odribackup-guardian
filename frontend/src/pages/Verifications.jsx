import React, { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, RefreshCw, AlertTriangle, FileCheck } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

const Verifications = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingRunId, setVerifyingRunId] = useState(null);

  const { hasRole } = useAuth();
  const canVerify = hasRole(['ADMINISTRATOR', 'OPERATOR']);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/verifications');
      setVerifications(res.data);
    } catch (err) {
      console.error('Failed to load verifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleTriggerVerification = async (runId) => {
    try {
      setVerifyingRunId(runId);
      await api.post(`/verifications/trigger/${runId}`);
      fetchVerifications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Verification trigger failed');
    } finally {
      setVerifyingRunId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Backup Integrity Verification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated checksum hashing, file existence, and corrupt archive detection
          </p>
        </div>
        <button
          onClick={fetchVerifications}
          className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Verification Status</span>
        </button>
      </div>

      {/* Verification Table */}
      <Card>
        {loading ? (
          <Spinner size="lg" className="h-48" />
        ) : verifications.length === 0 ? (
          <EmptyState
            title="No verifications available"
            description="Verification records will appear automatically when backup runs complete."
            icon={ShieldCheck}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Run ID & Job</th>
                  <th className="px-4 py-3.5">Server</th>
                  <th className="px-4 py-3.5">Existence Check</th>
                  <th className="px-4 py-3.5">SHA256 Checksum Hash</th>
                  <th className="px-4 py-3.5">Integrity Status</th>
                  <th className="px-4 py-3.5">Verified At</th>
                  {canVerify && <th className="px-4 py-3.5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold font-mono text-slate-900 dark:text-slate-100">Run #{v.run_id}</p>
                      <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold">{v.run?.job_name || 'Backup Task'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{v.run?.server?.name || 'Server'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {v.existence_checked ? (
                        <Badge variant="success" size="sm">File Present</Badge>
                      ) : (
                        <Badge variant="failed" size="sm">Missing File</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs" title={v.checksum_hash || 'N/A'}>
                      {v.checksum_hash || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5">
                      {v.verification_status === 'Verified' && <Badge variant="success">Verified</Badge>}
                      {v.verification_status === 'Failed' && <Badge variant="failed">Failed</Badge>}
                      {v.verification_status === 'Pending' && <Badge variant="warning">Pending</Badge>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(v.verified_at).toLocaleString()}
                    </td>
                    {canVerify && (
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleTriggerVerification(v.run_id)}
                          disabled={verifyingRunId === v.run_id}
                          className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{verifyingRunId === v.run_id ? 'Verifying...' : 'Re-verify'}</span>
                        </button>
                      </td>
                    )}
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

export default Verifications;
