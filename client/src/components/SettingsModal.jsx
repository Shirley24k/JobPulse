import React, { useState, useEffect } from 'react';
import { X, Settings, Mail, Bell, Shield, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function SettingsModal({ onClose, onSettingsSaved }) {
  const [settings, setSettings] = useState({
    alertEmail: '',
    followUpThresholdWorkingDays: 5,
    noResponseThresholdCalendarDays: 14,
    autoSendFollowUpAlerts: true,
    autoMarkNoResponse: true,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapUser: '',
    imapPass: ''
  });

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getSettings().then(res => {
      if (res.data) setSettings(res.data);
    }).catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    try {
      const res = await api.updateSettings(settings);
      setSettings(res.data);
      setSavedSuccess(true);
      if (onSettingsSaved) onSettingsSaved(res.data);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert('Error updating settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Platform Settings & Rules Config</h2>
              <p className="text-xs text-slate-400">Configure 5-day alert email targets, 14-day auto status, and SMTP</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Automated Rules Thresholds */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Automated Rules Engine (Requirements 3 & 4)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Follow-up Alert Threshold (Working Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={settings.followUpThresholdWorkingDays}
                  onChange={(e) => setSettings({ ...settings, followUpThresholdWorkingDays: parseInt(e.target.value) || 5 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Default: 5 working days (Mon-Fri)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Auto 'No Response' Threshold (Calendar Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={settings.noResponseThresholdCalendarDays}
                  onChange={(e) => setSettings({ ...settings, noResponseThresholdCalendarDays: parseInt(e.target.value) || 14 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Default: 14 days (2 weeks)</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alert Recipient Email (Your Email)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. candidate@example.com"
                  value={settings.alertEmail}
                  onChange={(e) => setSettings({ ...settings, alertEmail: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Where 5-working-day follow-up alert emails will be dispatched</p>
              </div>
            </div>
          </div>

          {/* Section 2: SMTP Configuration */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email Sender (SMTP - Optional)</span>
            </h3>

            <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 text-xs">
              <p className="text-slate-400 text-[11px]">
                Leave empty to run in built-in <strong>Dev Sandbox / HTML Preview mode</strong>, or provide real SMTP credentials (e.g. Gmail App Password, Outlook).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    placeholder="smtp.gmail.com"
                    value={settings.smtpHost || ''}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.smtpPort || 587}
                    onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">SMTP Username</label>
                  <input
                    type="text"
                    placeholder="your-email@gmail.com"
                    value={settings.smtpUser || ''}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">SMTP App Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={settings.smtpPass || ''}
                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Settings saved successfully!</span>
              </span>
            ) : <span />}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-600/30 transition active:scale-95"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
