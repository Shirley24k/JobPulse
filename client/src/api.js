const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  getCurrentUser: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Applications
  getApplications: () => request('/applications'),
  getApplication: (id) => request(`/applications/${id}`),
  createApplication: (data) => request('/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateApplication: (id, data) => request(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApplication: (id) => request(`/applications/${id}`, { method: 'DELETE' }),

  // Interviews
  addInterview: (appId, data) => request(`/applications/${appId}/interviews`, { method: 'POST', body: JSON.stringify(data) }),
  updateInterview: (appId, intId, data) => request(`/applications/${appId}/interviews/${intId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInterview: (appId, intId) => request(`/applications/${appId}/interviews/${intId}`, { method: 'DELETE' }),

  // Assessments
  addAssessment: (appId, data) => request(`/applications/${appId}/assessments`, { method: 'POST', body: JSON.stringify(data) }),
  updateAssessment: (appId, assId, data) => request(`/applications/${appId}/assessments/${assId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssessment: (appId, assId) => request(`/applications/${appId}/assessments/${assId}`, { method: 'DELETE' }),

  // Follow-up
  getFollowUpDraft: (appId, type = 'standard') => request(`/applications/${appId}/followup-draft?type=${type}`),
  sendFollowUp: (appId, data) => request(`/applications/${appId}/send-followup`, { method: 'POST', body: JSON.stringify(data) }),

  // Rules engine trigger
  runRulesCheck: () => request('/rules/run-check', { method: 'POST' }),

  // Alerts & Activities
  getAlerts: () => request('/alerts'),
  getActivityLogs: () => request('/activity-logs'),

  // Email Tracking & Simulation
  getEmailInbox: () => request('/emails/inbox'),
  simulateEmail: (data) => request('/emails/simulate', { method: 'POST', body: JSON.stringify(data) }),
  applyEmailToApp: (data) => request('/emails/apply-to-app', { method: 'POST', body: JSON.stringify(data) }),

  // Settings & Analytics
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getStats: () => request('/stats'),
};
