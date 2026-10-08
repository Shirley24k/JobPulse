import React from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  Layers, 
  Code2, 
  Video,
  PlusCircle,
  MoreVertical,
  Mail,
  Trash2
} from 'lucide-react';

const COLUMNS = [
  { id: 'applied', label: 'Applied', color: 'border-blue-500/50 bg-blue-950/20 text-blue-400' },
  { id: 'phone screening', label: 'Phone Screening', color: 'border-purple-500/50 bg-purple-950/20 text-purple-400' },
  { id: 'assessment', label: 'Assessment', color: 'border-amber-500/50 bg-amber-950/20 text-amber-400', hasAssessments: true },
  { id: 'interview', label: 'Interview', color: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-400', hasInterviews: true },
  { id: 'offered', label: 'Offered 🎉', color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400' },
  { id: 'no response', label: 'No Response (>2w)', color: 'border-slate-600/50 bg-slate-900/40 text-slate-400' },
  { id: 'rejected', label: 'Rejected', color: 'border-rose-500/50 bg-rose-950/20 text-rose-400' },
];

export default function KanbanBoard({ 
  applications, 
  onSelectApplication, 
  onStatusChange,
  onOpenNewModal,
  onDeleteApplication 
}) {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-8 pt-2 scrollbar-thin">
      {COLUMNS.map((column) => {
        const columnApps = applications.filter((app) => app.status === column.id);

        return (
          <div
            key={column.id}
            className="w-80 flex-shrink-0 flex flex-col bg-slate-900/60 rounded-xl border border-slate-800/80 max-h-[calc(100vh-180px)] overflow-hidden"
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b flex items-center justify-between ${column.color}`}>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm tracking-wide text-white">{column.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-200 border border-slate-700/50">
                  {columnApps.length}
                </span>
              </div>
              
              {column.id === 'applied' && (
                <button
                  onClick={onOpenNewModal}
                  title="Add application"
                  className="text-slate-400 hover:text-white transition"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Applications List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {columnApps.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg text-xs">
                  <span>No applications</span>
                </div>
              ) : (
                columnApps.map((app) => {
                  const interviewCount = app.interviews?.length || 0;
                  const assessmentCount = app.assessments?.length || 0;
                  const nextInterview = app.interviews?.find(i => i.status === 'scheduled');
                  const pendingAssessment = app.assessments?.find(a => a.status === 'pending' || a.status === 'in_progress');

                  return (
                    <div
                      key={app.id}
                      onClick={() => onSelectApplication(app)}
                      className="glass-card rounded-xl p-3.5 cursor-pointer relative group border border-slate-700/50 hover:border-brand-500/50 transition-all shadow-sm"
                    >
                      {/* Top row: Company & Follow-up indicator */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="font-bold text-sm text-white group-hover:text-brand-300 transition line-clamp-1">
                          {app.company}
                        </h4>
                        
                        {/* 5-day Follow-up alert badge */}
                        {app.needsFollowUp && (
                          <span 
                            title={`No response after ${app.workingDaysElapsed} working days. Action required!`}
                            className="flex-shrink-0 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse-subtle"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            <span>{app.workingDaysElapsed}d</span>
                          </span>
                        )}
                      </div>

                      {/* Role */}
                      <p className="text-xs text-slate-300 font-medium mb-2.5 line-clamp-1">
                        {app.role}
                      </p>

                      {/* Location & Salary */}
                      <div className="space-y-1 text-[11px] text-slate-400 mb-3">
                        {app.location && (
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="h-3 w-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{app.location}</span>
                          </div>
                        )}
                        {app.salary && (
                          <div className="flex items-center space-x-1.5 text-emerald-400/90 font-mono">
                            <DollarSign className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{app.salary}</span>
                          </div>
                        )}
                      </div>

                      {/* Multi-Interview & Multi-Assessment Badges */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-700/50">
                        {interviewCount > 0 && (
                          <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-indigo-950/50 border border-indigo-500/30 text-indigo-300">
                            <div className="flex items-center space-x-1.5 truncate">
                              <Video className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                              <span className="truncate">
                                {nextInterview ? nextInterview.roundName : `${interviewCount} Round${interviewCount > 1 ? 's' : ''}`}
                              </span>
                            </div>
                            <span className="font-bold text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-white ml-1">
                              R{interviewCount}
                            </span>
                          </div>
                        )}

                        {assessmentCount > 0 && (
                          <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-amber-950/50 border border-amber-500/30 text-amber-300">
                            <div className="flex items-center space-x-1.5 truncate">
                              <Code2 className="h-3 w-3 text-amber-400 flex-shrink-0" />
                              <span className="truncate">
                                {pendingAssessment ? pendingAssessment.title : `${assessmentCount} Assessment${assessmentCount > 1 ? 's' : ''}`}
                              </span>
                            </div>
                            <span className="font-bold text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-white ml-1">
                              A{assessmentCount}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer: Date & Quick Stage Change */}
                      <div className="mt-3 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>Applied {new Date(app.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </span>

                        {/* Actions: Fast status changer menu & Delete */}
                        <div className="flex items-center space-x-1">
                          <select
                            value={app.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onStatusChange(app.id, e.target.value)}
                            className="bg-slate-800 text-slate-300 text-[10px] rounded px-1.5 py-0.5 border border-slate-700 outline-none hover:border-slate-500 cursor-pointer"
                          >
                            <option value="applied">Applied</option>
                            <option value="phone screening">Phone Screen</option>
                            <option value="assessment">Assessment</option>
                            <option value="interview">Interview</option>
                            <option value="offered">Offered</option>
                            <option value="no response">No Response</option>
                            <option value="rejected">Rejected</option>
                          </select>

                          {onDeleteApplication && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete application for "${app.company}" (${app.role})?`)) {
                                  onDeleteApplication(app.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
                              title="Delete application"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
