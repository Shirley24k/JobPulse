import React from 'react';
import { 
  Briefcase, 
  Plus, 
  Mail, 
  Bell, 
  Calendar, 
  BarChart3, 
  LayoutGrid, 
  List, 
  RefreshCw, 
  Settings,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  stats, 
  onOpenNewModal, 
  onOpenEmailModal, 
  onOpenSettingsModal,
  onRunRulesCheck,
  loadingCheck 
}) {
  const followUpCount = stats?.activeAlertsCount || 0;
  const upcomingInterviewsCount = stats?.upcomingInterviews?.length || 0;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  JobPulse
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  Pro
                </span>
              </div>
              <p className="text-xs text-slate-400">Smart Job Application & Email Tracker</p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg flex items-center space-x-2">
              <span className="text-slate-400">Total Applied:</span>
              <span className="font-semibold text-white">{stats?.totalApplications || 0}</span>
            </div>

            {upcomingInterviewsCount > 0 && (
              <div className="bg-indigo-950/60 border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-indigo-300">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span><strong>{upcomingInterviewsCount}</strong> Interview{upcomingInterviewsCount > 1 ? 's' : ''} Scheduled</span>
              </div>
            )}

            {followUpCount > 0 && (
              <button 
                onClick={() => setCurrentTab('alerts')}
                className="bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center space-x-2 text-amber-300 hover:bg-amber-900/60 transition cursor-pointer animate-pulse-subtle"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span><strong>{followUpCount}</strong> Need Follow-up (&gt;5d)</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5">
            {/* Run Auto-Rules Trigger */}
            <button
              onClick={onRunRulesCheck}
              disabled={loadingCheck}
              title="Run 5-day alert & 14-day auto status check"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition flex items-center space-x-1.5 text-xs font-medium"
            >
              <RefreshCw className={`h-4 w-4 ${loadingCheck ? 'animate-spin text-brand-400' : ''}`} />
              <span className="hidden sm:inline">Check Rules</span>
            </button>

            {/* Email Sync & Simulator */}
            <button
              onClick={onOpenEmailModal}
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition flex items-center space-x-2 text-xs font-medium"
            >
              <Mail className="h-4 w-4 text-brand-400" />
              <span className="hidden sm:inline">Email Sync & Parser</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettingsModal}
              title="Settings (SMTP, IMAP, Thresholds)"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Add Application Button */}
            <button
              onClick={onOpenNewModal}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center space-x-1.5 shadow-lg shadow-brand-600/30 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Application</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 text-xs font-medium scrollbar-none">
          <button
            onClick={() => setCurrentTab('board')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition ${
              currentTab === 'board'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setCurrentTab('table')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition ${
              currentTab === 'table'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Detailed Table</span>
          </button>

          <button
            onClick={() => setCurrentTab('schedule')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition ${
              currentTab === 'schedule'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Schedule & Deadlines</span>
            {upcomingInterviewsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px]">
                {upcomingInterviewsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('alerts')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition ${
              currentTab === 'alerts'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>5-Day Follow-Up Alerts</span>
            {followUpCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px]">
                {followUpCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition ${
              currentTab === 'analytics'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Analytics & Pipeline</span>
          </button>
        </div>

      </div>
    </header>
  );
}
