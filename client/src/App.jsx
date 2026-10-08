import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import TableView from './components/TableView';
import ScheduleView from './components/ScheduleView';
import AlertsCenter from './components/AlertsCenter';
import AnalyticsView from './components/AnalyticsView';
import ApplicationDetailModal from './components/ApplicationDetailModal';
import NewApplicationModal from './components/NewApplicationModal';
import EmailSyncModal from './components/EmailSyncModal';
import SettingsModal from './components/SettingsModal';
import { api } from './api';
import { AlertTriangle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('board'); // 'board' | 'table' | 'schedule' | 'alerts' | 'analytics'
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.getApplications(),
        api.getStats()
      ]);
      setApplications(appsRes.data || []);
      setStats(statsRes.data || null);

      // If an application modal is open, refresh its data
      if (selectedApplication) {
        const fresh = (appsRes.data || []).find(a => a.id === selectedApplication.id);
        if (fresh) setSelectedApplication(fresh);
      }
    } catch (err) {
      console.error('Error fetching application data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedApplication]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunRulesCheck = async () => {
    setLoadingCheck(true);
    try {
      const res = await api.runRulesCheck();
      await fetchData();
      const alertsCount = res.result?.alertsSent?.length || 0;
      const statusCount = res.result?.statusesUpdated?.length || 0;
      
      showToast(`Automated Rules Check complete: ${alertsCount} follow-up alert(s) sent, ${statusCount} stale application(s) auto-marked as 'No response'.`);
    } catch (err) {
      showToast('Error evaluating rules: ' + err.message, 'error');
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const updated = await api.updateApplication(appId, { status: newStatus });
      setApplications(prev => prev.map(a => a.id === appId ? updated.data : a));
      fetchData();
      showToast(`Status updated to '${newStatus}'.`);
    } catch (err) {
      showToast('Error updating status: ' + err.message, 'error');
    }
  };

  const handleDeleteApplication = async (appId) => {
    try {
      await api.deleteApplication(appId);
      setApplications(prev => prev.filter(a => a.id !== appId));
      if (selectedApplication?.id === appId) setSelectedApplication(null);
      fetchData();
      showToast('Application deleted.');
    } catch (err) {
      showToast('Error deleting application: ' + err.message, 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const followUpRequiredApps = applications.filter(a => a.needsFollowUp);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        stats={stats}
        onOpenNewModal={() => setShowNewModal(true)}
        onOpenEmailModal={() => setShowEmailModal(true)}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        onRunRulesCheck={handleRunRulesCheck}
        loadingCheck={loadingCheck}
      />

      {/* Alert Banner if any application needs 5-day follow up */}
      {followUpRequiredApps.length > 0 && currentTab !== 'alerts' && (
        <div className="bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-200 animate-bounce" />
              <span>
                <strong>{followUpRequiredApps.length} application(s)</strong> have received no response after 5+ working days. Action required!
              </span>
            </div>

            <button
              onClick={() => setCurrentTab('alerts')}
              className="px-3 py-1 rounded bg-black/30 hover:bg-black/40 text-white text-xs font-bold transition flex items-center space-x-1"
            >
              <span>View Follow-Up Center</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Loading career tracking platform...</p>
          </div>
        ) : (
          <>
            {currentTab === 'board' && (
              <KanbanBoard
                applications={applications}
                onSelectApplication={(app) => setSelectedApplication(app)}
                onStatusChange={handleStatusChange}
                onOpenNewModal={() => setShowNewModal(true)}
                onDeleteApplication={handleDeleteApplication}
              />
            )}

            {currentTab === 'table' && (
              <TableView
                applications={applications}
                onSelectApplication={(app) => setSelectedApplication(app)}
                onStatusChange={handleStatusChange}
                onDeleteApplication={handleDeleteApplication}
              />
            )}

            {currentTab === 'schedule' && (
              <ScheduleView
                applications={applications}
                onSelectApplication={(app) => setSelectedApplication(app)}
              />
            )}

            {currentTab === 'alerts' && (
              <AlertsCenter
                applications={applications}
                onSelectApplication={(app) => setSelectedApplication(app)}
                onRefreshData={fetchData}
                onRunRulesCheck={handleRunRulesCheck}
                loadingCheck={loadingCheck}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsView
                stats={stats}
                applications={applications}
              />
            )}
          </>
        )}

      </main>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 animate-slide-up text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Modals */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdateApplication={(updatedApp) => {
            setSelectedApplication(updatedApp);
            fetchData();
          }}
          onRefreshData={fetchData}
          onDeleteApplication={handleDeleteApplication}
        />
      )}

      {showNewModal && (
        <NewApplicationModal
          onClose={() => setShowNewModal(false)}
          onApplicationCreated={(newApp) => {
            fetchData();
            showToast(`Added application for ${newApp.company}!`);
          }}
        />
      )}

      {showEmailModal && (
        <EmailSyncModal
          onClose={() => setShowEmailModal(false)}
          onRefreshData={fetchData}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onSettingsSaved={() => {
            fetchData();
            showToast('Settings saved.');
          }}
        />
      )}

    </div>
  );
}
