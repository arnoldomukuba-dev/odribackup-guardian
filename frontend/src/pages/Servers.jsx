import React, { useEffect, useState } from 'react';
import { Server, Plus, Search, Filter, Edit, Trash2, Power, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);

  const { hasRole } = useAuth();
  const canEdit = hasRole(['ADMINISTRATOR', 'OPERATOR']);
  const canDelete = hasRole(['ADMINISTRATOR']);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    host_ip: '',
    os: 'Ubuntu 22.04 LTS',
    environment: 'Production',
    location: 'Data Center',
    description: '',
    status: 'Active',
  });

  const fetchServers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (envFilter) params.environment = envFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/servers', { params });
      setServers(res.data);
    } catch (err) {
      console.error('Failed to fetch servers', err);
    } fontFinally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [search, envFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingServer(null);
    setFormData({
      name: '',
      host_ip: '',
      os: 'Ubuntu 22.04 LTS',
      environment: 'Production',
      location: 'Data Center',
      description: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (server) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      host_ip: server.host_ip,
      os: server.os,
      environment: server.environment,
      location: server.location,
      description: server.description || '',
      status: server.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingServer) {
        await api.put(`/servers/${editingServer.id}`, formData);
      } else {
        await api.post('/servers', formData);
      }
      setIsModalOpen(false);
      fetchServers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save server');
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this server?')) {
      try {
        await api.post(`/servers/${id}/deactivate`);
        fetchServers();
      } catch (err) {
        alert(err.response?.data?.detail || 'Deactivation failed');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to PERMANENTLY delete this server?')) {
      try {
        await api.delete(`/servers/${id}`);
        fetchServers();
      } catch (err) {
        alert(err.response?.data?.detail || 'Delete failed');
      }
    }
  };

  const envVariants = {
    Production: 'failed',
    Staging: 'warning',
    Development: 'info',
    Disaster_Recovery: 'purple',
  };

  const statusVariants = {
    Active: 'success',
    Inactive: 'neutral',
    Maintenance: 'warning',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Infrastructure Servers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registered physical and virtual backup nodes across environments
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Server</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by server name, host IP or OS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            >
              <option value="">All Environments</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
              <option value="Disaster_Recovery">Disaster Recovery</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Server Table */}
      <Card>
        {loading ? (
          <Spinner size="lg" className="h-48" />
        ) : servers.length === 0 ? (
          <EmptyState
            title="No servers registered"
            description="No infrastructure servers found matching your query."
            icon={Server}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Server Name</th>
                  <th className="px-4 py-3.5">Host IP / OS</th>
                  <th className="px-4 py-3.5">Environment</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last Successful Backup</th>
                  {canEdit && <th className="px-4 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {servers.map((server) => (
                  <tr key={server.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sky-600 dark:text-sky-400">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{server.name}</p>
                          <p className="text-xs text-slate-400 truncate max-w-xs">{server.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs">
                      <p className="text-slate-900 dark:text-slate-100 font-semibold">{server.host_ip}</p>
                      <p className="text-slate-400">{server.os}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={envVariants[server.environment] || 'default'}>
                        {server.environment}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {server.location}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={statusVariants[server.status] || 'default'}>
                        {server.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {server.last_successful_backup
                        ? new Date(server.last_successful_backup).toLocaleString()
                        : 'Never'}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(server)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                          title="Edit Server"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {server.status === 'Active' && (
                          <button
                            onClick={() => handleDeactivate(server.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            title="Deactivate Server"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(server.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Server"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Server Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingServer ? 'Edit Server Configuration' : 'Register New Server'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Server Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                placeholder="e.g. prod-db-01"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Host IP / Domain *
              </label>
              <input
                type="text"
                required
                value={formData.host_ip}
                onChange={(e) => setFormData({ ...formData, host_ip: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                placeholder="e.g. 10.0.1.100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Operating System *
              </label>
              <input
                type="text"
                required
                value={formData.os}
                onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Environment *
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Development">Development</option>
                <option value="Disaster_Recovery">Disaster Recovery</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Location *
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              >
                <option value="Data Center">Data Center</option>
                <option value="AWS">AWS Cloud</option>
                <option value="Azure">Azure Cloud</option>
                <option value="GCP">GCP Cloud</option>
                <option value="On_Premise">On Premise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
              Description
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              placeholder="Server role notes, region, or contact details..."
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
              {editingServer ? 'Save Changes' : 'Create Server'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Servers;
