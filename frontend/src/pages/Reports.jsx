import React, { useEffect, useState } from 'react';
import { FileBarChart, Download, Calendar, ShieldCheck, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';

const Reports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Daily');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/summary', { params: { period } });
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleExportJSON = () => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `odri_backup_report_${period.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading && !report) {
    return <Spinner size="lg" className="h-64" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            SLA & Compliance Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Historical backup compliance metrics, SLA fulfillment rates, and server reliability rankings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {['Daily', 'Weekly', 'Monthly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportJSON}
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report JSON</span>
          </button>
        </div>
      </div>

      {report && (
        <>
          {/* Executive Overview Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Server Compliance Rate
                  </p>
                  <h3 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                    {report.compliance.compliance_rate}%
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {report.compliance.backed_up_servers} / {report.compliance.total_servers} Servers Protected
                  </p>
                </div>
                <div className="p-3 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    SLA Met Executions
                  </p>
                  <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {report.compliance.sla_met_count}
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    SLA Targets Fulfilled
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    SLA Missed Executions
                  </p>
                  <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                    {report.compliance.sla_missed_count}
                  </h3>
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    Requires Remediation
                  </p>
                </div>
                <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Integrity Check Pass Rate
                  </p>
                  <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {report.verification.integrity_pass_rate}%
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {report.verification.verified_count} Verifications Passed
                  </p>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Server Ranking Table */}
          <Card title="Server Compliance & SLA Rankings">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Server</th>
                    <th className="px-4 py-3.5">Environment</th>
                    <th className="px-4 py-3.5">Total Runs</th>
                    <th className="px-4 py-3.5">Successful Runs</th>
                    <th className="px-4 py-3.5">SLA Compliance</th>
                    <th className="px-4 py-3.5">Last Successful Backup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {report.server_rankings.map((s, idx) => (
                    <tr key={s.server_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <span className="text-xs text-slate-400 font-mono mr-2">#{idx + 1}</span>
                        {s.server_name}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="purple">{s.environment}</Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {s.total_runs}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        {s.successful_runs}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-sky-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${s.compliance_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {s.compliance_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {s.last_backup ? new Date(s.last_backup).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;
