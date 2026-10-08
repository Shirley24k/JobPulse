import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Code2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ScheduleView({ applications, onSelectApplication }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'interviews' | 'assessments'

  // Aggregate all interview rounds and assessments across all applications
  const scheduleItems = [];

  applications.forEach(app => {
    // Interviews
    if (app.interviews) {
      app.interviews.forEach(int => {
        scheduleItems.push({
          id: int.id,
          type: 'interview',
          appId: app.id,
          company: app.company,
          role: app.role,
          title: int.roundName,
          dateTime: int.scheduledAt,
          duration: int.duration,
          interviewers: int.interviewers,
          link: int.meetingLink,
          status: int.status,
          notes: int.notes,
          app
        });
      });
    }

    // Assessments
    if (app.assessments) {
      app.assessments.forEach(ass => {
        scheduleItems.push({
          id: ass.id,
          type: 'assessment',
          appId: app.id,
          company: app.company,
          role: app.role,
          title: `${ass.platform}: ${ass.title}`,
          dateTime: ass.dueDate ? `${ass.dueDate}T23:59:59` : ass.assignedDate,
          isDue: true,
          platform: ass.platform,
          link: ass.link,
          status: ass.status,
          notes: ass.notes,
          app
        });
      });
    }
  });

  // Sort chronologically
  const sortedItems = scheduleItems
    .filter(item => filterType === 'all' || item.type === filterType)
    .sort((a, b) => new Date(a.dateTime || 0).getTime() - new Date(b.dateTime || 0).getTime());

  const upcomingItems = sortedItems.filter(item => {
    if (item.type === 'interview') return item.status === 'scheduled';
    if (item.type === 'assessment') return item.status === 'pending' || item.status === 'in_progress';
    return true;
  });

  const completedItems = sortedItems.filter(item => !upcomingItems.includes(item));

  return (
    <div className="space-y-6 py-2">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-indigo-400" />
            <span>Interview Schedule & Assessment Deadlines</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized timeline of upcoming interview sessions and take-home deadlines
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterType === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Events ({scheduleItems.length})
          </button>
          <button
            onClick={() => setFilterType('interview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              filterType === 'interview' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Interviews</span>
          </button>
          <button
            onClick={() => setFilterType('assessment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              filterType === 'assessment' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Assessments</span>
          </button>
        </div>
      </div>

      {/* Upcoming Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Upcoming Actions & Deadlines ({upcomingItems.length})</span>
        </h4>

        {upcomingItems.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
            No upcoming interview sessions or pending assessment deadlines!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingItems.map(item => (
              <div
                key={item.id}
                onClick={() => onSelectApplication(item.app)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                  item.type === 'interview'
                    ? 'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-500/60'
                    : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`p-1.5 rounded-lg ${
                      item.type === 'interview' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {item.type === 'interview' ? <Video className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
                    </span>
                    <div>
                      <h5 className="font-bold text-sm text-white">{item.company}</h5>
                      <span className="text-xs text-slate-300 font-medium">{item.title}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    item.type === 'interview'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.type}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 text-white font-medium">
                    <Clock className="h-3.5 w-3.5 text-brand-400" />
                    <span>
                      {new Date(item.dateTime).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {item.duration && <span className="text-slate-400 font-normal">({item.duration})</span>}
                  </div>

                  {item.interviewers && (
                    <p className="text-[11px] text-slate-400">Interviewer: <strong className="text-slate-200">{item.interviewers}</strong></p>
                  )}

                  {item.link && (
                    <div className="pt-1">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 text-xs text-brand-400 hover:underline"
                      >
                        <span>Join Call / Open Link</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed History */}
      {completedItems.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Past Rounds & Submitted Assessments ({completedItems.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedItems.map(item => (
              <div
                key={item.id}
                onClick={() => onSelectApplication(item.app)}
                className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs space-y-1 opacity-70 hover:opacity-100 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-white">{item.company}</strong>
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase">{item.status}</span>
                </div>
                <p className="text-slate-400 line-clamp-1">{item.title}</p>
                <p className="text-[10px] text-slate-500">{new Date(item.dateTime).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
