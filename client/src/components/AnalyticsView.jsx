import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Briefcase, 
  Layers, 
  Target,
  Percent
} from 'lucide-react';

export default function AnalyticsView({ stats, applications }) {
  const statusCounts = stats?.statusCounts || {};
  const total = stats?.totalApplications || 0;

  const funnelSteps = [
    { label: 'Applied', count: total, color: 'bg-blue-500' },
    { label: 'Phone Screen / First Contact', count: (statusCounts['phone screening'] || 0) + (statusCounts.assessment || 0) + (statusCounts.interview || 0) + (statusCounts.offered || 0), color: 'bg-purple-500' },
    { label: 'Assessment Stage', count: (statusCounts.assessment || 0) + (statusCounts.interview || 0) + (statusCounts.offered || 0), color: 'bg-amber-500' },
    { label: 'Interview Rounds', count: (statusCounts.interview || 0) + (statusCounts.offered || 0), color: 'bg-indigo-500' },
    { label: 'Job Offers', count: statusCounts.offered || 0, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6 py-2">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Applied</span>
            <Briefcase className="h-4 w-4 text-brand-400" />
          </div>
          <div className="text-3xl font-black text-white">{total}</div>
          <p className="text-[11px] text-slate-400">Applications currently tracked</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Response Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{stats?.responseRate || 0}%</div>
          <p className="text-[11px] text-slate-400">Moved past initial 'applied' state</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Interview Conversion</span>
            <Target className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-400">{stats?.interviewConversion || 0}%</div>
          <p className="text-[11px] text-slate-400">Reached interview or offer stage</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Alerts (&gt;5d)</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{stats?.activeAlertsCount || 0}</div>
          <p className="text-[11px] text-slate-400">Applications needing follow-up</p>
        </div>

      </div>

      {/* Funnel & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Application Funnel */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-brand-400" />
            <span>Application Pipeline Funnel</span>
          </h4>

          <div className="space-y-4 pt-2">
            {funnelSteps.map((step, idx) => {
              const pct = total > 0 ? Math.round((step.count / total) * 100) : 0;
              return (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">{step.label}</span>
                    <span className="text-white font-mono">{step.count} ({pct}%)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${step.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, step.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution Grid */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>Status Stage Distribution</span>
          </h4>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Applied', key: 'applied', color: 'text-blue-400 bg-blue-950/40 border-blue-500/20' },
              { label: 'Phone Screening', key: 'phone screening', color: 'text-purple-400 bg-purple-950/40 border-purple-500/20' },
              { label: 'Assessment', key: 'assessment', color: 'text-amber-400 bg-amber-950/40 border-amber-500/20' },
              { label: 'Interview Loop', key: 'interview', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20' },
              { label: 'Offers Received 🎉', key: 'offered', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20' },
              { label: 'No Response (>2w)', key: 'no response', color: 'text-slate-400 bg-slate-800/40 border-slate-700/40' },
              { label: 'Rejected', key: 'rejected', color: 'text-rose-400 bg-rose-950/40 border-rose-500/20' },
            ].map(item => (
              <div key={item.key} className={`p-3 rounded-xl border ${item.color} flex items-center justify-between`}>
                <span className="text-xs font-medium text-slate-300">{item.label}</span>
                <strong className="text-base font-bold font-mono text-white">{statusCounts[item.key] || 0}</strong>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
