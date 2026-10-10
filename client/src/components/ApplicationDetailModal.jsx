import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  FileText, 
  ExternalLink, 
  Video, 
  Code2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Send, 
  Copy, 
  AlertTriangle,
  Layers,
  Sparkles,
  Edit2,
  Save
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api';

export default function ApplicationDetailModal({ 
  application, 
  onClose, 
  onUpdateApplication, 
  onRefreshData,
  onDeleteApplication 
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'interviews' | 'assessments' | 'followup' | 'emails'
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...application });

  // Interview state
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    roundName: '',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    duration: '45 mins',
    interviewers: '',
    meetingLink: '',
    status: 'scheduled',
    notes: '',
    feedback: ''
  });

  // Assessment state
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    type: 'Online Assessment',
    platform: 'HackerRank',
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    link: '',
    notes: ''
  });

  // Follow-up draft state
  const [followUpType, setFollowUpType] = useState('polite_nudge');
  const [followUpDraft, setFollowUpDraft] = useState({ subject: '', body: '' });
  const [copied, setCopied] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  useEffect(() => {
    setFormData({ ...application });
  }, [application]);

  // Fetch follow-up draft when tab or template changes
  useEffect(() => {
    if (activeTab === 'followup') {
      api.getFollowUpDraft(application.id, followUpType).then(res => {
        if (res.data) setFollowUpDraft(res.data);
      }).catch(err => console.error(err));
    }
  }, [activeTab, followUpType, application.id]);

  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === 'offered') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      const updated = await api.updateApplication(application.id, { status: newStatus });
      onUpdateApplication(updated.data);
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleSaveBasicInfo = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateApplication(application.id, formData);
      onUpdateApplication(updated.data);
      setIsEditing(false);
    } catch (err) {
      alert('Error saving info: ' + err.message);
    }
  };

  const handleAddInterview = async (e) => {
    e.preventDefault();
    try {
      const updated = editingInterviewId
        ? await api.updateInterview(application.id, editingInterviewId, interviewForm)
        : await api.addInterview(application.id, interviewForm);
      onUpdateApplication(updated.data);
      setShowAddInterview(false);
      setEditingInterviewId(null);
      setInterviewForm({
        roundName: '',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        duration: '45 mins',
        interviewers: '',
        meetingLink: '',
        status: 'scheduled',
        notes: '',
        feedback: ''
      });
    } catch (err) {
      alert(`Error ${editingInterviewId ? 'updating' : 'adding'} interview: ${err.message}`);
    }
  };

  const handleEditInterview = (round) => {
    setEditingInterviewId(round.id);
    setInterviewForm({
      roundName: round.roundName || '',
      scheduledAt: round.scheduledAt ? round.scheduledAt.slice(0, 16) : '',
      duration: round.duration || '',
      interviewers: round.interviewers || '',
      meetingLink: round.meetingLink || '',
      status: round.status || 'scheduled',
      notes: round.notes || '',
      feedback: round.feedback || ''
    });
    setShowAddInterview(true);
  };

  const handleToggleInterviewStatus = async (interviewId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'scheduled' : 'completed';
    try {
      const updated = await api.updateInterview(application.id, interviewId, { status: newStatus });
      onUpdateApplication(updated.data);
    } catch (err) {
      alert('Error updating interview: ' + err.message);
    }
  };

  const handleDeleteInterview = async (interviewId) => {
    if (!window.confirm('Delete this interview round?')) return;
    try {
      const updated = await api.deleteInterview(application.id, interviewId);
      onUpdateApplication(updated.data);
    } catch (err) {
      alert('Error deleting interview: ' + err.message);
    }
  };

  const handleAddAssessment = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.addAssessment(application.id, assessmentForm);
      onUpdateApplication(updated.data);
      setShowAddAssessment(false);
      setAssessmentForm({
        title: '',
        type: 'Online Assessment',
        platform: 'HackerRank',
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        link: '',
        notes: ''
      });
    } catch (err) {
      alert('Error adding assessment: ' + err.message);
    }
  };

  const handleUpdateAssessmentStatus = async (assessmentId, status) => {
    try {
      const updates = { status };
      if (status === 'submitted') updates.submittedAt = new Date().toISOString();
      const updated = await api.updateAssessment(application.id, assessmentId, updates);
      onUpdateApplication(updated.data);
    } catch (err) {
      alert('Error updating assessment: ' + err.message);
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!window.confirm('Delete this assessment?')) return;
    try {
      const updated = await api.deleteAssessment(application.id, assessmentId);
      onUpdateApplication(updated.data);
    } catch (err) {
      alert('Error deleting assessment: ' + err.message);
    }
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(`Subject: ${followUpDraft.subject}\n\n${followUpDraft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkFollowUpSent = async () => {
    setSendingFollowUp(true);
    try {
      const res = await api.sendFollowUp(application.id, {
        subject: followUpDraft.subject,
        body: followUpDraft.body,
        sentTo: application.contactEmail
      });
      onUpdateApplication(res.data);
      alert('Follow-up email logged! 5-day timer has been reset.');
    } catch (err) {
      alert('Error logging follow up: ' + err.message);
    } finally {
      setSendingFollowUp(false);
    }
  };

  const interviews = application.interviews || [];
  const assessments = application.assessments || [];
  const emailThreads = application.emailThreads || [];
  const followUpHistory = application.followUpHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">{application.company}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full capitalize font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                {application.status}
              </span>
              {application.needsFollowUp && (
                <span className="flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse-subtle">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{application.workingDaysElapsed} Working Days Silence</span>
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-300">{application.role}</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Status Stage Change */}
            <select
              value={application.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white font-medium outline-none hover:border-brand-500 cursor-pointer"
            >
              <option value="applied">Status: Applied</option>
              <option value="phone screening">Status: Phone Screening</option>
              <option value="assessment">Status: Assessment</option>
              <option value="interview">Status: Interview</option>
              <option value="offered">Status: Offered 🎉</option>
              <option value="no response">Status: No Response</option>
              <option value="rejected">Status: Rejected</option>
              <option value="withdrawn">Status: Withdrawn</option>
            </select>

            {onDeleteApplication && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to permanently delete the job application for "${application.company}" (${application.role})? This cannot be undone.`)) {
                    onDeleteApplication(application.id);
                    onClose();
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 transition flex items-center space-x-1 text-xs"
                title="Delete this entire application"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 px-6 border-b border-slate-800 bg-slate-900/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'overview'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Overview & Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('interviews')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'interviews'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="h-4 w-4" />
            <span>Interview Sessions ({interviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assessments')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'assessments'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>Assessments & Tests ({assessments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('followup')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'followup'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Follow-up Composer</span>
            {application.needsFollowUp && (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'emails'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Email History ({emailThreads.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {isEditing ? (
                <form onSubmit={handleSaveBasicInfo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Company *</label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Role Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Salary / Compensation</label>
                      <input
                        type="text"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Recruiter / Contact Name</label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Recruiter Email</label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Job Post URL</label>
                      <input
                        type="url"
                        value={formData.jobUrl}
                        onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Resume Version Used</label>
                      <input
                        type="text"
                        value={formData.resumeVersion}
                        onChange={(e) => setFormData({ ...formData, resumeVersion: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Notes & Research</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...application });
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Action row */}
                  <div className="flex justify-between items-center bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">
                      Applied on <strong className="text-white">{new Date(application.appliedDate).toLocaleDateString()}</strong> ({application.calendarDaysElapsed} calendar days ago)
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 border border-slate-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit Details</span>
                    </button>
                  </div>

                  {/* Grid of Key Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        <span>Location</span>
                      </div>
                      <p className="text-xs font-medium text-white">{application.location || 'Not specified'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Compensation</span>
                      </div>
                      <p className="text-xs font-medium text-emerald-300 font-mono">{application.salary || 'Not specified'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <User className="h-3.5 w-3.5 text-brand-400" />
                        <span>Recruiter / Contact</span>
                      </div>
                      <p className="text-xs font-medium text-white">{application.contactName || 'Recruiting Team'}</p>
                      {application.contactEmail && (
                        <p className="text-[11px] text-slate-400 truncate">{application.contactEmail}</p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <FileText className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Resume Version</span>
                      </div>
                      <p className="text-xs font-medium text-white">{application.resumeVersion || 'Default'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        <span>Working Days Silence</span>
                      </div>
                      <p className="text-xs font-medium text-white">
                        {application.workingDaysElapsed} business days
                        {application.needsFollowUp && <span className="text-amber-400 font-bold ml-1">(&gt;5d alert active)</span>}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                        <span>Job Link</span>
                      </div>
                      {application.jobUrl ? (
                        <a
                          href={application.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand-400 hover:underline truncate block"
                        >
                          {application.jobUrl}
                        </a>
                      ) : (
                        <p className="text-xs text-slate-500">No URL saved</p>
                      )}
                    </div>
                  </div>

                  {/* Notes Card */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Notes & Details</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {application.notes || 'No notes added yet. Click "Edit Details" to add interview prep, company notes, or referral info.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MULTI-INTERVIEW TRACKER */}
          {activeTab === 'interviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Interview Sessions</h3>
                  <p className="text-xs text-slate-400">Track multiple interview rounds (Recruiter Screen, Coding, System Design, Bar Raiser)</p>
                </div>
                <button
                  onClick={() => setShowAddInterview(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Interview Round</span>
                </button>
              </div>

              {/* Add Interview Form */}
              {showAddInterview && (
                <form onSubmit={handleAddInterview} className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase">
                    {editingInterviewId ? 'Edit Interview Session' : 'New Interview Session'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Round Name *</label>
                      <input
                        type="text"
                        required={Boolean(!editingInterviewId || interviewForm.scheduledAt)}
                        placeholder="e.g. Round 2: System Design & Scalability"
                        value={interviewForm.roundName}
                        onChange={(e) => setInterviewForm({ ...interviewForm, roundName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Scheduled Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={interviewForm.scheduledAt}
                        onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 45 mins, 60 mins"
                        value={interviewForm.duration}
                        onChange={(e) => setInterviewForm({ ...interviewForm, duration: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Interviewers</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Chen (Staff Eng), Sarah (Manager)"
                        value={interviewForm.interviewers}
                        onChange={(e) => setInterviewForm({ ...interviewForm, interviewers: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Meeting Link (Google Meet / Zoom / Teams)</label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/..."
                        value={interviewForm.meetingLink}
                        onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Prep Notes & Focus Topics</label>
                      <textarea
                        rows={2}
                        placeholder="Topics to review, questions to ask the interviewer..."
                        value={interviewForm.notes}
                        onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddInterview(false);
                        setEditingInterviewId(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      {editingInterviewId ? 'Save Changes' : 'Save Round'}
                    </button>
                  </div>
                </form>
              )}

              {/* Interview List */}
              <div className="space-y-3">
                {interviews.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    No interview rounds recorded yet. Click "Add Interview Round" to log your first session.
                  </div>
                ) : (
                  interviews.map((round, idx) => (
                    <div
                      key={round.id || idx}
                      className={`p-4 rounded-xl border transition ${
                        round.status === 'completed'
                          ? 'bg-slate-900/40 border-slate-800 opacity-80'
                          : 'bg-indigo-950/20 border-indigo-500/30 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => handleToggleInterviewStatus(round.id, round.status)}
                            className={`mt-0.5 p-1 rounded-full border transition ${
                              round.status === 'completed'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'border-slate-600 text-slate-500 hover:border-indigo-400 hover:text-indigo-400'
                            }`}
                            title={round.status === 'completed' ? 'Mark as scheduled' : 'Mark as completed'}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-indigo-400 px-1.5 py-0.2 rounded bg-indigo-500/20">
                                Round {round.roundNumber || idx + 1}
                              </span>
                              <h4 className={`text-sm font-bold ${round.status === 'completed' ? 'line-through text-slate-400' : 'text-white'}`}>
                                {round.roundName}
                              </h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                <span>
                                  {round.scheduledAt
                                    ? new Date(round.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                    : 'Schedule not set'}
                                </span>
                              </span>
                              {round.duration && <span>• {round.duration}</span>}
                              {round.interviewers && <span>• Interviewer: <strong className="text-slate-300">{round.interviewers}</strong></span>}
                            </div>

                            {round.meetingLink && (
                              <div className="mt-2">
                                <a
                                  href={round.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition"
                                >
                                  <Video className="h-3 w-3" />
                                  <span>Join Call / Meeting Link</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            )}

                            {round.notes && (
                              <div className="mt-2 p-2 rounded bg-slate-800/60 text-xs text-slate-300 border border-slate-700/50">
                                <strong className="text-slate-400 text-[10px] uppercase">Notes:</strong> {round.notes}
                              </div>
                            )}

                            {round.feedback && (
                              <div className="mt-1.5 p-2 rounded bg-emerald-950/30 text-xs text-emerald-300 border border-emerald-500/20">
                                <strong className="text-emerald-400 text-[10px] uppercase">Feedback:</strong> {round.feedback}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditInterview(round)}
                            className="p-1.5 text-slate-500 hover:text-indigo-400 transition"
                            title="Edit round"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInterview(round.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                            title="Delete round"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MULTI-ASSESSMENT TRACKER */}
          {activeTab === 'assessments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Assessments & Coding Challenges</h3>
                  <p className="text-xs text-slate-400">Track take-home projects, HackerRank/CodeSignal tests, and due dates</p>
                </div>
                <button
                  onClick={() => setShowAddAssessment(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-amber-600/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Assessment</span>
                </button>
              </div>

              {/* Add Assessment Form */}
              {showAddAssessment && (
                <form onSubmit={handleAddAssessment} className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 uppercase">New Assessment Record</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Assessment Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HackerRank 90-min Algorithm OA"
                        value={assessmentForm.title}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Platform / Format</label>
                      <select
                        value={assessmentForm.platform}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, platform: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="HackerRank">HackerRank</option>
                        <option value="CodeSignal">CodeSignal</option>
                        <option value="Codility">Codility</option>
                        <option value="LeetCode">LeetCode</option>
                        <option value="GitHub Repo">GitHub Take-Home</option>
                        <option value="Custom Project">Custom Project</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Assigned Date</label>
                      <input
                        type="date"
                        value={assessmentForm.assignedDate}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, assignedDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={assessmentForm.dueDate}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, dueDate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Test Link / Repository URL</label>
                      <input
                        type="url"
                        placeholder="https://hackerrank.com/..."
                        value={assessmentForm.link}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, link: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Notes & Problem Details</label>
                      <textarea
                        rows={2}
                        placeholder="Time limit, questions to prepare, score target..."
                        value={assessmentForm.notes}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, notes: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAssessment(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                    >
                      Save Assessment
                    </button>
                  </div>
                </form>
              )}

              {/* Assessment List */}
              <div className="space-y-3">
                {assessments.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    No assessments logged. Click "Add Assessment" to record online assessments or take-homes.
                  </div>
                ) : (
                  assessments.map((ass, idx) => (
                    <div
                      key={ass.id || idx}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                              {ass.platform}
                            </span>
                            <h4 className="text-sm font-bold text-white">{ass.title}</h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                            {ass.dueDate && (
                              <span className="flex items-center space-x-1 text-amber-300">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Due: <strong>{ass.dueDate}</strong></span>
                              </span>
                            )}
                            <span>Assigned: {ass.assignedDate}</span>
                            {ass.submittedAt && (
                              <span className="text-emerald-400">
                                Submitted {new Date(ass.submittedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <select
                            value={ass.status}
                            onChange={(e) => handleUpdateAssessmentStatus(ass.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-slate-200 outline-none cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="submitted">Submitted</option>
                            <option value="passed">Passed ✅</option>
                            <option value="failed">Failed ❌</option>
                          </select>

                          <button
                            onClick={() => handleDeleteAssessment(ass.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                            title="Delete assessment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {ass.link && (
                        <div className="pt-1">
                          <a
                            href={ass.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 text-xs text-brand-400 hover:underline"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            <span>Open Assessment Portal / Repository</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      )}

                      {ass.notes && (
                        <p className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                          {ass.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FOLLOW-UP COMPOSER */}
          {activeTab === 'followup' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300 uppercase">Automated 5-Day Alert Status</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {application.workingDaysElapsed} working days have elapsed since last communication.
                    {application.needsFollowUp 
                      ? ' High priority: Sending a follow-up email is strongly recommended.'
                      : ' Follow-up alert timer is currently within normal threshold.'}
                  </p>
                </div>
              </div>

              {/* Template selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 mr-1">Template Style:</span>
                {[
                  { id: 'polite_nudge', label: 'Polite Nudge' },
                  { id: 'post_interview', label: 'Post-Interview Check-in' },
                  { id: 'urgent_competing_offer', label: 'Competing Offer / Timeline' },
                  { id: 'standard', label: 'Standard Formal' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFollowUpType(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      followUpType === t.id
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Draft Box */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={followUpDraft.subject}
                    onChange={(e) => setFollowUpDraft({ ...followUpDraft, subject: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Body</label>
                  <textarea
                    rows={8}
                    value={followUpDraft.body}
                    onChange={(e) => setFollowUpDraft({ ...followUpDraft, body: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white leading-relaxed font-sans"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400">
                    Recruiter contact: <strong className="text-slate-200">{application.contactEmail || 'No email saved'}</strong>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyDraft}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 border border-slate-700 transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy Email'}</span>
                    </button>

                    <button
                      onClick={handleMarkFollowUpSent}
                      disabled={sendingFollowUp}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 transition active:scale-95"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{sendingFollowUp ? 'Logging...' : 'Mark as Sent & Reset 5-Day Timer'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Past follow-ups history */}
              {followUpHistory.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Follow-Up History</h4>
                  <div className="space-y-2">
                    {followUpHistory.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span className="font-semibold text-slate-200">{item.subject}</span>
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2">{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EMAIL THREADS & ACTIVITY */}
          {activeTab === 'emails' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Parsed Email Threads & Updates</h3>
                <p className="text-xs text-slate-400">Emails automatically parsed and linked to this application</p>
              </div>

              <div className="space-y-3">
                {emailThreads.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    No email threads linked yet. Use the "Email Sync & Parser" tool in the top bar to scan or simulate incoming emails.
                  </div>
                ) : (
                  emailThreads.map((em, idx) => (
                    <div key={em.id || idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-white">{em.subject}</h4>
                          <p className="text-[11px] text-slate-400">From: {em.from}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(em.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 whitespace-pre-wrap">
                        {em.fullBody || em.snippet}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
