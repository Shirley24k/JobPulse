import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  AlertTriangle, 
  ExternalLink, 
  Video, 
  Code2, 
  Trash2, 
  Clock,
  CheckCircle2,
  Calendar
} from 'lucide-react';

const STATUS_BADGE_CLASS = {
  applied: 'badge-applied',
  'phone screening': 'badge-screening',
  assessment: 'badge-assessment',
  interview: 'badge-interview',
  offered: 'badge-offered',
  'no response': 'badge-no-response',
  rejected: 'badge-rejected',
  withdrawn: 'badge-withdrawn',
};

export default function TableView({ 
  applications, 
  onSelectApplication, 
  onStatusChange, 
  onDeleteApplication 
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('appliedDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => {
        const matchesSearch = 
          app.company.toLowerCase().includes(search.toLowerCase()) ||
          app.role.toLowerCase().includes(search.toLowerCase()) ||
          (app.location && app.location.toLowerCase().includes(search.toLowerCase())) ||
          (app.notes && app.notes.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'appliedDate' || sortBy === 'lastContactDate') {
          valA = new Date(valA || 0).getTime();
          valB = new Date(valB || 0).getTime();
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [applications, search, statusFilter, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4 py-2">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, role, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Filters & Counts */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-500"
            >
              <option value="all">All Statuses ({applications.length})</option>
              <option value="applied">Applied</option>
              <option value="phone screening">Phone Screening</option>
              <option value="assessment">Assessment</option>
              <option value="interview">Interview</option>
              <option value="offered">Offered</option>
              <option value="no response">No Response</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredApplications.length}</strong> records
          </span>
        </div>

      </div>

      {/* Applications Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort('company')}>
                <div className="flex items-center space-x-1">
                  <span>Company & Role</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort('status')}>
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5">Interviews & Assessments</th>
              <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort('appliedDate')}>
                <div className="flex items-center space-x-1">
                  <span>Applied Date</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5">Silence / Follow-Up</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-500">
                  No applications match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => {
                const interviewCount = app.interviews?.length || 0;
                const assessmentCount = app.assessments?.length || 0;
                const nextInterview = app.interviews?.find(i => i.status === 'scheduled');
                const pendingAssessment = app.assessments?.find(a => a.status === 'pending' || a.status === 'in_progress');

                return (
                  <tr
                    key={app.id}
                    onClick={() => onSelectApplication(app)}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    {/* Company & Role */}
                    <td className="p-3.5">
                      <div className="font-bold text-white text-sm hover:text-brand-300 transition">
                        {app.company}
                      </div>
                      <div className="text-slate-300 font-medium">{app.role}</div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        {app.location && <span>{app.location}</span>}
                        {app.salary && <span className="text-emerald-400 font-mono">• {app.salary}</span>}
                      </div>
                    </td>

                    {/* Status Badge & Selector */}
                    <td className="p-3.5">
                      <div className="flex flex-col space-y-1.5 items-start">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${STATUS_BADGE_CLASS[app.status] || 'badge-applied'}`}>
                          {app.status}
                        </span>
                        
                        <select
                          value={app.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onStatusChange(app.id, e.target.value)}
                          className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 rounded px-1.5 py-0.5 outline-none hover:border-slate-500 cursor-pointer"
                        >
                          <option value="applied">Applied</option>
                          <option value="phone screening">Phone Screening</option>
                          <option value="assessment">Assessment</option>
                          <option value="interview">Interview</option>
                          <option value="offered">Offered</option>
                          <option value="no response">No Response</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </td>

                    {/* Multiple Interviews & Assessments */}
                    <td className="p-3.5 space-y-1.5">
                      {interviewCount > 0 && (
                        <div className="flex items-center space-x-2 text-indigo-300 bg-indigo-950/40 border border-indigo-500/20 px-2 py-1 rounded-md max-w-xs">
                          <Video className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                          <span className="truncate">
                            <strong>{interviewCount} Round{interviewCount > 1 ? 's' : ''}:</strong> {nextInterview ? nextInterview.roundName : 'Completed'}
                          </span>
                        </div>
                      )}

                      {assessmentCount > 0 && (
                        <div className="flex items-center space-x-2 text-amber-300 bg-amber-950/40 border border-amber-500/20 px-2 py-1 rounded-md max-w-xs">
                          <Code2 className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                          <span className="truncate">
                            <strong>{assessmentCount} Test{assessmentCount > 1 ? 's' : ''}:</strong> {pendingAssessment ? pendingAssessment.title : 'All Done'}
                          </span>
                        </div>
                      )}

                      {interviewCount === 0 && assessmentCount === 0 && (
                        <span className="text-slate-500 text-[11px]">None recorded</span>
                      )}
                    </td>

                    {/* Applied Date */}
                    <td className="p-3.5 text-slate-300">
                      <div className="font-medium">
                        {new Date(app.appliedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {app.calendarDaysElapsed} calendar days ago
                      </div>
                    </td>

                    {/* Silence / 5-day Follow up Alert */}
                    <td className="p-3.5">
                      {app.needsFollowUp ? (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold animate-pulse-subtle">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          <span>{app.workingDaysElapsed} working days no reply</span>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-[11px] flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{app.workingDaysElapsed} working days</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition"
                            title="Open Job Posting"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete application for ${app.company}?`)) {
                              onDeleteApplication(app.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/50 rounded transition"
                          title="Delete Application"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
