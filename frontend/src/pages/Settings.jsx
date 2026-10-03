
import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Mail,
  MessageSquare,
  Save,
  Check,
} from 'lucide-react';
import Card from '../components/common/Card';

const Settings = () => {
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    email_alerts: true,
    email_recipient: 'admin@odribackup.internal',
    slack_alerts: true,
    pagerduty_alerts: false,
    pagerduty_integration_key: '',
    checksum_verification_frequency: 'Daily',
    retention_auto_prune: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600">
          <SettingsIcon className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            System &amp; Notification Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure notifications, verification schedules, and backup retention.
          </p>
        </div>
      </div>

      {saved && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm flex items-center gap-3"
        >
          <Check className="w-5 h-5" />
          <span>
            Settings submitted. Backend persistence must be configured separately.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card title="Alert Notification Channels">
          <div className="space-y-5">
            {/* Email notifications */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-sky-600" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Email Notifications
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive critical backup failure alerts by email.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.email_alerts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email_alerts: e.target.checked,
                    })
                  }
                  aria-label="Enable email notifications"
                />
              </div>

              {settings.email_alerts && (
                <div className="mt-4">
                  <label
                    htmlFor="email_recipient"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Alert Recipient Email
                  </label>

                  <input
                    id="email_recipient"
                    type="email"
                    required
                    value={settings.email_recipient}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        email_recipient: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>

            {/* Slack notifications */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Slack Notifications
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enable or disable Slack failure alerts.
                      Configure webhook credentials securely on the backend.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.slack_alerts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      slack_alerts: e.target.checked,
                    })
                  }
                  aria-label="Enable Slack notifications"
                />
              </div>
            </div>

            {/* PagerDuty notifications */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      PagerDuty Alerts
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enable or disable PagerDuty notifications.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.pagerduty_alerts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pagerduty_alerts: e.target.checked,
                    })
                  }
                  aria-label="Enable PagerDuty alerts"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Integrity Verification and Retention">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="checksum_frequency"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1"
              >
                Checksum Verification Schedule
              </label>

              <select
                id="checksum_frequency"
                value={settings.checksum_verification_frequency}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    checksum_verification_frequency: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              >
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>

            <div className="flex items-center gap-3 sm:pt-6">
              <input
                type="checkbox"
                id="auto_prune"
                checked={settings.retention_auto_prune}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    retention_auto_prune: e.target.checked,
                  })
                }
              />

              <label
                htmlFor="auto_prune"
                className="text-sm text-slate-700 dark:text-slate-300"
              >
                Automatically prune expired backup archives
              </label>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            className="py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
