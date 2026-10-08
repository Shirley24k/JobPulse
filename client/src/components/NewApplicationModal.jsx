import React, { useState } from 'react';
import { X, Building2, Plus, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function NewApplicationModal({ onClose, onApplicationCreated }) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'applied',
    location: '',
    salary: '',
    jobUrl: '',
    appliedDate: new Date().toISOString().split('T')[0],
    contactName: '',
    contactEmail: '',
    resumeVersion: 'Senior_FullStack_2026.pdf',
    source: 'LinkedIn',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company || !formData.role) {
      alert('Please fill in Company Name and Role.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createApplication({
        ...formData,
        appliedDate: new Date(formData.appliedDate).toISOString(),
      });
      onApplicationCreated(res.data);
      onClose();
    } catch (err) {
      alert('Error creating application: ' + err.message);
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
            <div className="h-10 w-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Job Application</h2>
              <p className="text-xs text-slate-400">Record a new role and start automated tracking & alerts</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe, OpenAI, Apple"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Role Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full Stack Engineer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none cursor-pointer"
              >
                <option value="applied">Applied (Initial Submission)</option>
                <option value="phone screening">Phone Screening</option>
                <option value="assessment">Assessment</option>
                <option value="interview">Interview</option>
                <option value="offered">Offered</option>
                <option value="no response">No Response</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date Applied *</label>
              <input
                type="date"
                required
                value={formData.appliedDate}
                onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location & Work Mode</label>
              <input
                type="text"
                placeholder="e.g. Remote / San Francisco, CA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Salary / Compensation</label>
              <input
                type="text"
                placeholder="e.g. $170k - $200k + Equity"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Recruiter / Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Recruiter Email</label>
              <input
                type="email"
                placeholder="e.g. sarah.jenkins@company.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Job Posting URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.jobUrl}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Resume File / Version</label>
              <input
                type="text"
                placeholder="e.g. FullStack_Resume_v2.pdf"
                value={formData.resumeVersion}
                onChange={(e) => setFormData({ ...formData, resumeVersion: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
              />
            </div>

          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes & Application Context</label>
            <textarea
              rows={3}
              placeholder="Referral details, job requirements, interview questions, tech stack..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-[11px] text-slate-500">
              * 5-day alert & 14-day auto status tracking will start immediately.
            </span>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-brand-600/30 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>{loading ? 'Adding...' : 'Add Application'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
