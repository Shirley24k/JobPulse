import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  Send, 
  Mail, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { api } from '../api';

export default function AlertsCenter({ 
  applications, 
  onSelectApplication, 
  onRefreshData,
  onRunRulesCheck,
  loadingCheck 
}) {
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [previewAlert, setPreviewAlert] = useState(null);

  useEffect(() => {
    fetchAlertsData();
  }, []);

  const fetchAlertsData = async () => {
    try {
      const [alertsRes, actRes] = await Promise.all([
        api.getAlerts(),
        api.getActivityLogs()
      ]);
      setAlerts(alertsRes.data || []);
      setActivities(actRes.data || []);
    } catch (err) {
      console.error('Error fetching alerts data:', err);
    }
  };

  const followUpRequiredApps = applications.filter(a => a.needsFollowUp);
  const autoNoResponseApps = applications.filter(a => a.status === 'no response' && a.autoNoResponseTriggered);

  return (
    <div className="space-y-6 py-2">
      
      {/* Top Banner & Trigger */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Automated Rules & Follow-Up Alert Center</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                Rule 3 & 4 Engine
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              <strong>Rule 1 (5 Working Days):</strong> Sends alert email & flags applications when no update is received in 5 business days.<br/>
              <strong>Rule 2 (14 Calendar Days):</strong> Automatically updates stale 'applied' applications to 'No response' status.
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            await onRunRulesCheck();
            fetchAlertsData();
          }}
          disabled={loadingCheck}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-amber-600/30 transition active:scale-95 flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loadingCheck ? 'animate-spin' : ''}`} />
          <span>{loadingCheck ? 'Evaluating...' : 'Run Rules Evaluation Now'}</span>
        </button>
      </div>

      {/* Grid: 5-Day Alerts & 14-Day Auto Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active 5 Working Days Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Requires Follow-Up (&ge; 5 Working Days)</span>
            </h4>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              {followUpRequiredApps.length} active
            </span>
          </div>

          <div className="space-y-3">
            {followUpRequiredApps.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                <CheckCircle2 className="h-6 w-6 text-emerald-500/60 mx-auto mb-2" />
                All active applications have received timely responses or are within the 5-day window.
              </div>
            ) : (
              followUpRequiredApps.map(app => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/20">
                          {app.workingDaysElapsed} Business Days Silent
                        </span>
                        <h5 className="font-bold text-sm text-white">{app.company}</h5>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{app.role}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Applied: {new Date(app.appliedDate).toLocaleDateString()} • Contact: {app.contactName || 'Hiring Team'} ({app.contactEmail || 'No email saved'})
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectApplication(app)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-amber-600/20"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Compose Follow-Up</span>
                    </button>
                  </div>

                  <div className="text-xs text-amber-200/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/20">
                    💡 <strong>Tip:</strong> Click "Compose Follow-Up" to preview and send a tailored polite check-in email to reset the 5-day cycle.
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 14 Calendar Days Auto 'No Response' History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Auto 'No Response' Transitions (&ge; 2 Weeks)</span>
            </h4>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {autoNoResponseApps.length} moved
            </span>
          </div>

          <div className="space-y-3">
            {autoNoResponseApps.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                No applications have exceeded the 14-day silence threshold.
              </div>
            ) : (
              autoNoResponseApps.map(app => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          Auto-Moved: No Response
                        </span>
                        <h5 className="font-bold text-sm text-slate-200">{app.company}</h5>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{app.role}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Applied {app.calendarDaysElapsed} calendar days ago ({new Date(app.appliedDate).toLocaleDateString()})
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectApplication(app)}
                      className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                    >
                      View Record &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Dispatched Alert Emails Log */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <Mail className="h-4 w-4 text-brand-400" />
              <span>Dispatched Follow-up Notification Emails ({alerts.length})</span>
            </h4>
            <p className="text-xs text-slate-400">Emails sent by Nodemailer / Alert Engine to notify you when 5 working days elapse</p>
          </div>
        </div>

        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
              No alert emails dispatched yet. Click "Run Rules Evaluation Now" to scan active records.
            </div>
          ) : (
            alerts.map((alertItem) => (
              <div
                key={alertItem.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">{alertItem.subject}</h5>
                    <p className="text-[11px] text-slate-400">
                      To: {alertItem.recipient} • Sent: {new Date(alertItem.sentAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewAlert(alertItem)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1 border border-slate-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Email HTML</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* HTML Email Preview Modal */}
      {previewAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Alert Email Preview</h4>
              <button onClick={() => setPreviewAlert(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
              <div 
                dangerouslySetInnerHTML={{ __html: previewAlert.htmlPreview }} 
                className="rounded-lg overflow-hidden border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
