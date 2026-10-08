import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  Calendar, 
  Code2, 
  Video,
  Send,
  Building2,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';

const SAMPLE_PRESETS = [
  {
    title: 'Stripe Interview Invitation (Meet Link + Round)',
    from: 'Sarah Jenkins <sarah.jenkins@stripe.com>',
    subject: 'Invitation: Stripe Technical Architecture Interview - Senior Fullstack Engineer',
    body: `Hi Shirley,\n\nThank you for taking the time to speak with our talent partner earlier this week. The team was very impressed with your background!\n\nWe would love to invite you to our next stage: a 60-minute Technical Architecture & System Design Interview.\n\nPlease find the meeting link below:\nhttps://meet.google.com/abc-stripe-arch\n\nLooking forward to speaking with you!\n\nBest regards,\nSarah Jenkins\nEngineering Recruiting @ Stripe`
  },
  {
    title: 'Amazon Online Assessment (HackerRank OA)',
    from: 'Amazon Recruiting Team <no-reply@amazon.jobs>',
    subject: 'Amazon Online Assessment Invitation: Software Development Engineer II',
    body: `Dear Shirley,\n\nThank you for your interest in the Software Development Engineer II role at Amazon.\n\nAs the next step in our selection process, we invite you to complete the HackerRank technical assessment. This 90-minute assessment covers data structures, algorithms, and system problem solving.\n\nAssessment Link:\nhttps://www.hackerrank.com/amazon-sde-assessment-2026\n\nPlease complete this within 5 business days.\n\nSincerely,\nAmazon Talent Acquisition`
  },
  {
    title: 'Google Round 2 Coding Screen',
    from: 'David Miller <dmiller@google.com>',
    subject: 'Google Interview Update: Scheduling Round 2 Technical Screen',
    body: `Hello Shirley,\n\nGreat news! Following your initial phone screen, our hiring committee would like to move forward with a Round 2 Coding & Algorithms Interview for the Senior Software Engineer role.\n\nWe will be conducting the session via Google Meet:\nhttps://meet.google.com/xyz-goog-sde\n\nBest,\nDavid Miller\nStaff Technical Recruiter @ Google`
  },
  {
    title: 'Netflix Application Acknowledgment',
    from: 'Netflix Talent <talent@netflix.com>',
    subject: 'Your Application for Staff UI Engineer at Netflix',
    body: `Hi Shirley,\n\nWe have received your application for the Staff UI Engineer position at Netflix. Our engineering team is currently reviewing your resume and portfolio. We will follow up with next steps shortly.\n\nThanks,\nNetflix Recruiting`
  }
];

export default function EmailSyncModal({ onClose, onRefreshData }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('simulate'); // 'simulate' | 'inbox'
  
  // Custom simulator input
  const [customFrom, setCustomFrom] = useState(SAMPLE_PRESETS[0].from);
  const [customSubject, setCustomSubject] = useState(SAMPLE_PRESETS[0].subject);
  const [customBody, setCustomBody] = useState(SAMPLE_PRESETS[0].body);
  const [parsingResult, setParsingResult] = useState(null);
  const [trackingSuccess, setTrackingSuccess] = useState(null);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await api.getEmailInbox();
      setEmails(res.data || []);
    } catch (err) {
      console.error('Error fetching email inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setCustomFrom(preset.from);
    setCustomSubject(preset.subject);
    setCustomBody(preset.body);
    setParsingResult(null);
    setTrackingSuccess(null);
  };

  const handleParseAndSimulate = async () => {
    setLoading(true);
    setTrackingSuccess(null);
    try {
      const res = await api.simulateEmail({
        from: customFrom,
        subject: customSubject,
        body: customBody
      });
      setParsingResult(res.data.parsed);
      fetchInbox();
    } catch (err) {
      alert('Error simulating email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoTrack = async (parsedData) => {
    setLoading(true);
    try {
      const res = await api.applyEmailToApp({
        parsedData: parsedData || parsingResult
      });
      setTrackingSuccess(`Successfully ${res.action === 'created' ? 'created new application' : 'updated existing application'} for ${parsedData?.extractedCompany || parsingResult?.extractedCompany}!`);
      onRefreshData();
    } catch (err) {
      alert('Error tracking email into application: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Email Application Progress Tracker</h2>
              <p className="text-xs text-slate-400">Automatically parse recruiter emails, interview invites, and assessment tests</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center space-x-2 px-6 border-b border-slate-800 bg-slate-900/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('simulate')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'simulate'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Interactive Recruiter Email Simulator & Parser</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'inbox'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Synced Emails Log ({emails.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* SIMULATOR TAB */}
          {activeTab === 'simulate' && (
            <div className="space-y-5">
              
              {/* Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Select a Real-World Email Preset to Test:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="p-2.5 rounded-lg text-left text-xs bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-brand-500/50 transition flex items-center space-x-2 text-slate-200"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
                      <span className="truncate">{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Form */}
              <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">From (Sender)</label>
                    <input
                      type="text"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject</label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Body Content</label>
                  <textarea
                    rows={5}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono leading-relaxed"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleParseAndSimulate}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-600/30 transition active:scale-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{loading ? 'Analyzing...' : 'Parse & Extract Application Details'}</span>
                  </button>
                </div>
              </div>

              {/* Parsing Result Showcase */}
              {parsingResult && (
                <div className="p-5 rounded-xl bg-slate-800/80 border border-brand-500/40 space-y-4 animate-slide-up">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">Smart Parser Results</h4>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {Math.round(parsingResult.confidence * 100)}% Confidence Match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Company</span>
                      <strong className="text-white text-sm">{parsingResult.extractedCompany}</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Detected Role</span>
                      <strong className="text-white text-xs">{parsingResult.extractedRole}</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Suggested Status</span>
                      <strong className="text-brand-400 capitalize text-xs">{parsingResult.suggestedStatus}</strong>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Email Category</span>
                      <strong className="text-indigo-300 capitalize text-xs">{parsingResult.detectedType.replace('_', ' ')}</strong>
                    </div>
                  </div>

                  {/* Interview Details Detected */}
                  {parsingResult.interviewDetails && (
                    <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 space-y-1 text-xs text-indigo-300">
                      <div className="flex items-center space-x-2 font-bold text-indigo-200">
                        <Video className="h-4 w-4" />
                        <span>Detected Interview Session: {parsingResult.interviewDetails.roundName}</span>
                      </div>
                      <p>Meeting Link: {parsingResult.interviewDetails.meetingLink || 'To be scheduled'}</p>
                    </div>
                  )}

                  {/* Assessment Details Detected */}
                  {parsingResult.assessmentDetails && (
                    <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 space-y-1 text-xs text-amber-300">
                      <div className="flex items-center space-x-2 font-bold text-amber-200">
                        <Code2 className="h-4 w-4" />
                        <span>Detected Assessment: {parsingResult.assessmentDetails.title} ({parsingResult.assessmentDetails.platform})</span>
                      </div>
                      <p>Test Link: {parsingResult.assessmentDetails.link || 'In email body'}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2 flex items-center justify-between">
                    {trackingSuccess ? (
                      <div className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{trackingSuccess}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Ready to automatically update or create this job application.
                      </span>
                    )}

                    <button
                      onClick={() => handleAutoTrack(parsingResult)}
                      disabled={loading}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition active:scale-95"
                    >
                      <span>Auto-Track into Platform</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* INBOX TAB */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Showing all emails parsed and tracked by the platform
                </span>
                <button
                  onClick={fetchInbox}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center space-x-1 border border-slate-700"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Inbox</span>
                </button>
              </div>

              <div className="space-y-3">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-brand-400 px-2 py-0.5 rounded bg-brand-500/20">
                            {email.extractedCompany}
                          </span>
                          <h4 className="font-semibold text-xs text-white">{email.subject}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">From: {email.from}</p>
                      </div>

                      <button
                        onClick={() => handleAutoTrack(email)}
                        className="px-3 py-1 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold flex items-center space-x-1"
                      >
                        <span>Apply / Update</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800 whitespace-pre-wrap">
                      {email.snippet || email.fullBody}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
