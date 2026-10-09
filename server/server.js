require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const { calculateWorkingDays, calculateCalendarDays, evaluateApplicationRules } = require('./rulesEngine');
const emailService = require('./emailService');
const {
  SESSION_TTL_SECONDS,
  clearSessionCookie,
  getConfig,
  isConfigured,
  requireAuth,
  setSessionCookie,
  signToken,
  verifyPassword,
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());

app.get('/api/auth/me', (req, res) => {
  const sessionCookie = String(req.headers.cookie || '')
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith('jobpulse_session='));
  const token = sessionCookie ? decodeURIComponent(sessionCookie.slice('jobpulse_session='.length)) : '';
  const session = verifyToken(token);

  if (!session) return res.status(401).json({ success: false, error: 'Not signed in.' });
  res.json({ success: true, data: { username: session.username } });
});

app.post('/api/auth/login', (req, res) => {
  const config = getConfig();
  if (!isConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Set AUTH_USERNAME, AUTH_PASSWORD_HASH, and SESSION_SECRET on the server before signing in.',
    });
  }

  const { username, password } = req.body || {};
  if (username !== config.username || !verifyPassword(password, config.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signToken({
    username: config.username,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  });
  setSessionCookie(res, token);
  res.json({ success: true, data: { username: config.username } });
});

app.post('/api/auth/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

// All application data and mutations require an authenticated session.
app.use('/api', requireAuth);

// Helper to decorate application with live computed fields
function decorateApplication(appRecord, settings) {
  if (!appRecord) return null;
  const refDate = appRecord.lastContactDate || appRecord.appliedDate || appRecord.createdAt;
  const workingDaysElapsed = calculateWorkingDays(refDate, new Date());
  const calendarDaysElapsed = calculateCalendarDays(appRecord.appliedDate || refDate, new Date());
  
  const followUpThreshold = settings.followUpThresholdWorkingDays || 5;
  const noResponseThreshold = settings.noResponseThresholdCalendarDays || 14;

  const needsFollowUp = ['applied', 'phone screening', 'interview', 'assessment'].includes(appRecord.status) &&
    workingDaysElapsed >= followUpThreshold &&
    !appRecord.autoFollowUpAlertSent &&
    !['no response', 'rejected', 'offered', 'withdrawn'].includes(appRecord.status);

  const eligibleForNoResponse = appRecord.status === 'applied' && calendarDaysElapsed >= noResponseThreshold;

  return {
    ...appRecord,
    workingDaysElapsed,
    calendarDaysElapsed,
    needsFollowUp,
    eligibleForNoResponse,
  };
}

// ------------------- API ROUTES -------------------

// 1. Get all applications
app.get('/api/applications', async (req, res) => {
  try {
    const settings = await db.getSettings();
    const rawApps = await db.getAllApplications();
    const apps = rawApps.map(a => decorateApplication(a, settings));
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get single application
app.get('/api/applications/:id', async (req, res) => {
  try {
    const settings = await db.getSettings();
    const rawApp = await db.getApplicationById(req.params.id);
    if (!rawApp) return res.status(404).json({ success: false, error: 'Application not found' });
    res.json({ success: true, data: decorateApplication(rawApp, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create application manually
app.post('/api/applications', async (req, res) => {
  try {
    const { company, role, status, location, salary, jobUrl, appliedDate, notes, contactName, contactEmail, resumeVersion, source } = req.body;
    if (!company || !role) {
      return res.status(400).json({ success: false, error: 'Company and Role are required.' });
    }

    const newApp = await db.createApplication({
      company,
      role,
      status: status || 'applied',
      location: location || '',
      salary: salary || '',
      jobUrl: jobUrl || '',
      appliedDate: appliedDate || new Date().toISOString(),
      lastContactDate: appliedDate || new Date().toISOString(),
      notes: notes || '',
      contactName: contactName || '',
      contactEmail: contactEmail || '',
      resumeVersion: resumeVersion || 'Main Resume',
      source: source || 'Manual Entry'
    });

    const settings = await db.getSettings();
    res.status(201).json({ success: true, data: decorateApplication(newApp, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update application
app.put('/api/applications/:id', async (req, res) => {
  try {
    const updated = await db.updateApplication(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Application not found' });
    const settings = await db.getSettings();
    res.json({ success: true, data: decorateApplication(updated, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete application
app.delete('/api/applications/:id', async (req, res) => {
  try {
    const success = await db.deleteApplication(req.params.id);
    if (!success) return res.status(404).json({ success: false, error: 'Application not found' });
    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Interview Management
app.post('/api/applications/:id/interviews', async (req, res) => {
  try {
    const appRecord = await db.addInterview(req.params.id, req.body);
    if (!appRecord) return res.status(404).json({ success: false, error: 'Application not found' });
    const settings = await db.getSettings();
    res.json({ success: true, data: decorateApplication(appRecord, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/applications/:id/interviews/:intId', async (req, res) => {
  try {
    const appRecord = await db.updateInterview(req.params.id, req.params.intId, req.body);
    if (!appRecord) return res.status(404).json({ success: false, error: 'Application or interview not found' });
    const settings = await db.getSettings();
    res.json({ success: true, data: decorateApplication(appRecord, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/applications/:id/interviews/:intId', async (req, res) => {
  try {
    const appRecord = await db.deleteInterview(req.params.id, req.params.intId);
    if (!appRecord) return res.status(404).json({ success: false, error: 'Application or interview not found' });
    const settings = await db.getSettings();
    res.json({ success: true, data: decorateApplication(appRecord, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Assessment Management
app.post('/api/applications/:id/assessments', async (req, res) => {
  try {
    const appRecord = await db.addAssessment(req.params.id, req.body);
    if (!appRecord) return res.status(404).json({ success: false, error: 'Application not found' });
    const settings = await db.getSettings();
    res.json({ success: true, data: decorateApplication(appRecord, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/applications/:id/assessments/:assId', async (req, res) => {
  try {
    const appRecord = await db.updateAssessment(req.params.id, req.params.assId, req.body);
    if (!appRecord) return res.status(404).json({ success: false, error: 'Application or assessment not found' });
    const settings = await db.getSettings();
    res.json({ success: true, data: decorateApplication(appRecord, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/applications/:id/assessments/:assId', async (req, res) => {
  try {
    const appRecord = await db.deleteAssessment(req.params.id, req.params.assId);
    if (!appRecord) return res.status(404).json({ success: false, error: 'Application or assessment not found' });
    const settings = await db.getSettings();
    res.json({ success: true, data: decorateApplication(appRecord, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Follow-up Email Generator & Actions
app.get('/api/applications/:id/followup-draft', async (req, res) => {
  try {
    const appRecord = await db.getApplicationById(req.params.id);
    if (!appRecord) return res.status(404).json({ success: false, error: 'Application not found' });
    const type = req.query.type || 'standard';
    const draft = emailService.generateFollowUpDraft(appRecord, type);
    res.json({ success: true, data: draft });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/applications/:id/send-followup', async (req, res) => {
  try {
    const appRecord = await db.getApplicationById(req.params.id);
    if (!appRecord) return res.status(404).json({ success: false, error: 'Application not found' });

    const { subject, body, sentTo } = req.body;
    const newEntry = {
      id: 'flw-' + Date.now(),
      date: new Date().toISOString(),
      type: 'email_sent',
      subject: subject || `Follow-up on ${appRecord.role} at ${appRecord.company}`,
      body: body || '',
      sentTo: sentTo || appRecord.contactEmail || 'Recruiter'
    };

    await db.addFollowUpHistory(appRecord.id, newEntry);
    const updated = await db.updateApplication(appRecord.id, {
      lastContactDate: new Date().toISOString(),
      autoFollowUpAlertSent: false
    });

    await db.logActivity('followup_sent', `Logged follow-up email sent to ${appRecord.company}`, appRecord.id);

    const settings = await db.getSettings();
    res.json({ success: true, message: 'Follow-up logged and last contact date updated.', data: decorateApplication(updated, settings) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Automated Rules Check Execution
app.post('/api/rules/run-check', async (req, res) => {
  try {
    const result = await executeRulesCheck();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function executeRulesCheck() {
  const settings = await db.getSettings();
  const applications = await db.getAllApplications();
  const evaluation = evaluateApplicationRules(applications, settings);

  const results = {
    alertsSent: [],
    statusesUpdated: [],
    timestamp: new Date().toISOString()
  };

  // 1. Process 14 Days auto 'No response'
  if (settings.autoMarkNoResponse !== false) {
    for (const update of evaluation.statusUpdatesNeeded) {
      const app = await db.getApplicationById(update.appId);
      if (app && app.status === 'applied') {
        await db.updateApplication(app.id, {
          status: 'no response',
          autoNoResponseTriggered: true,
          lastStatusUpdateDate: new Date().toISOString()
        });
        await db.logActivity('auto_status', update.reason, app.id);
        results.statusesUpdated.push({
          appId: app.id,
          company: app.company,
          role: app.role,
          reason: update.reason
        });
      }
    }
  }

  // 2. Process 5 Working Days Follow-Up Alerts
  if (settings.autoSendFollowUpAlerts !== false) {
    for (const alertInfo of evaluation.followUpAlertsNeeded) {
      const app = await db.getApplicationById(alertInfo.appId);
      if (app && !app.autoFollowUpAlertSent) {
        const alertRecord = await emailService.sendFollowUpAlert({
          toEmail: settings.alertEmail,
          application: app,
          workingDaysElapsed: alertInfo.workingDaysElapsed,
          settings
        });

        await db.updateApplication(app.id, { autoFollowUpAlertSent: true });
        await db.addAlert(alertRecord);
        await db.logActivity('alert_triggered', `Sent 5-working-day follow-up alert email for ${app.company}`, app.id);
        
        results.alertsSent.push({
          appId: app.id,
          company: app.company,
          workingDaysElapsed: alertInfo.workingDaysElapsed,
          alertId: alertRecord.id
        });
      }
    }
  }

  return results;
}

// ── Email Auto-Sync ──────────────────────────────────────────────────────────
// Checkpoint is persisted in the settings table. A null checkpoint means this
// is the first sync, so the initial window looks back 24 hours.

/**
 * Fetches emails received since the persisted sync checkpoint, parses them,
 * matches each to an existing application by company name, and auto-applies
 * status upgrades, interview details, and assessment records.
 * Only actionable email types (interview, assessment, offer, rejection) trigger
 * updates. The checkpoint advances to syncStartTime after every successful run.
 */
async function executeEmailAutoSync() {
  // Capture the window boundaries before any async work
  const syncStartTime = new Date();
  const settings = await db.getSettings();
  const persistedCheckpoint = settings.lastEmailSyncCheckpoint;
  const windowStart = persistedCheckpoint
    ? new Date(persistedCheckpoint)
    : new Date(syncStartTime.getTime() - 24 * 60 * 60 * 1000);
  const allParsedEmails = await emailService.syncEmails(settings);

  // Filter to only emails received within [windowStart, syncStartTime)
  const parsedEmails = allParsedEmails.filter(parsed => {
    if (!parsed.date) return false;
    const emailTime = new Date(parsed.date);
    return emailTime >= windowStart && emailTime < syncStartTime;
  });

  const allApps = await db.getAllApplications();

  const results = {
    windowStart: windowStart.toISOString(),
    windowEnd: syncStartTime.toISOString(),
    emailsInWindow: parsedEmails.length,
    emailsProcessed: 0,
    statusesUpdated: [],
    interviewsAdded: [],
    assessmentsAdded: [],
    skipped: [],
    timestamp: syncStartTime.toISOString()
  };

  console.log(`[Email Auto-Sync] Checking emails since ${windowStart.toISOString()} (${parsedEmails.length} in window)`);

  // Statuses where an upgrade should be allowed (don't downgrade terminal states)
  const upgradeableStatuses = ['applied', 'phone screening', 'assessment', 'interview'];
  const terminalStatuses = ['offered', 'rejected', 'withdrawn', 'no response'];

  // Email types that should trigger an auto-update
  const actionableTypes = [
    'interview_invitation',
    'phone_screening',
    'assessment_assigned',
    'offer',
    'rejection'
  ];

  for (const parsed of parsedEmails) {
    const emailId = parsed.id;

    // Skip non-actionable email types
    if (!actionableTypes.includes(parsed.detectedType)) {
      results.skipped.push({ emailId, reason: `non_actionable_type:${parsed.detectedType}` });
      continue;
    }

    // Find a matching application by company name (case-insensitive)
    const companyLower = (parsed.extractedCompany || '').toLowerCase();
    const normalizedCompany = companyLower.replace(/[^a-z0-9]/g, '');
    const matchedApp = allApps.find(
        a => {
          if (terminalStatuses.includes(a.status)) return false;
          const normalizedAppCompany = a.company.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedAppCompany === normalizedCompany ||
            (normalizedAppCompany.length >= 4 &&
              (normalizedCompany.includes(normalizedAppCompany) ||
                normalizedAppCompany.includes(normalizedCompany)));
        }
    );

    if (!matchedApp) {
      results.skipped.push({ emailId, reason: `no_matching_app_for:${parsed.extractedCompany}` });
      continue;
    }

    // Don't downgrade status — only upgrade within the pipeline
    const shouldUpdateStatus =
      parsed.suggestedStatus &&
      upgradeableStatuses.includes(matchedApp.status) &&
      parsed.suggestedStatus !== matchedApp.status;

    const updates = {
      lastContactDate: new Date().toISOString(),
      autoFollowUpAlertSent: false
    };

    if (shouldUpdateStatus) {
      updates.status = parsed.suggestedStatus;
      updates.lastStatusUpdateDate = new Date().toISOString();
    }

    await db.updateApplication(matchedApp.id, updates);

    // Attach interview details if present
    if (parsed.interviewDetails) {
      await db.addInterview(matchedApp.id, parsed.interviewDetails);
      results.interviewsAdded.push({
        appId: matchedApp.id,
        company: matchedApp.company,
        roundName: parsed.interviewDetails.roundName
      });
    }

    // Attach assessment details if present
    if (parsed.assessmentDetails) {
      await db.addAssessment(matchedApp.id, parsed.assessmentDetails);
      results.assessmentsAdded.push({
        appId: matchedApp.id,
        company: matchedApp.company,
        platform: parsed.assessmentDetails.platform
      });
    }

    // Store the raw email thread on the application
    await db.addEmailThread(matchedApp.id, {
      subject: parsed.subject,
      from: parsed.from,
      date: parsed.date || new Date().toISOString(),
      snippet: parsed.snippet,
      fullBody: parsed.fullBody
    });

    const logMsg = shouldUpdateStatus
      ? `[Auto Email Sync] Status updated to "${parsed.suggestedStatus}" for ${matchedApp.company} from email: "${parsed.subject}"`
      : `[Auto Email Sync] Email linked to ${matchedApp.company} (status unchanged: "${matchedApp.status}")`;

    await db.logActivity('email_auto_synced', logMsg, matchedApp.id);

    if (shouldUpdateStatus) {
      results.statusesUpdated.push({
        appId: matchedApp.id,
        company: matchedApp.company,
        oldStatus: matchedApp.status,
        newStatus: parsed.suggestedStatus,
        emailSubject: parsed.subject
      });
    }

    results.emailsProcessed++;
  }

  // Persist only after the full sync succeeds so a failed run can be retried.
  await db.updateSettings({ lastEmailSyncCheckpoint: syncStartTime.toISOString() });

  if (results.statusesUpdated.length > 0 || results.interviewsAdded.length > 0) {
    console.log(`[Email Auto-Sync] Updated ${results.statusesUpdated.length} application(s), added ${results.interviewsAdded.length} interview(s), ${results.assessmentsAdded.length} assessment(s).`);
  }

  return results;
}

// 10. Email Inbox Tracking & Recruiter Email Simulator
app.get('/api/emails/inbox', async (req, res) => {
  try {
    const settings = await db.getSettings();
    const emails = await emailService.syncEmails(settings);
    res.json({ success: true, data: emails });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/emails/simulate', async (req, res) => {
  try {
    const { from, subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ success: false, error: 'Subject and body are required to simulate email.' });
    }
    const result = emailService.receiveSimulatedEmail({ from, subject, body });
    await db.logActivity('email_received', `Received and parsed recruiter email: "${subject}"`);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-apply or link parsed email to application
app.post('/api/emails/apply-to-app', async (req, res) => {
  try {
    const { emailId, parsedData, targetAppId } = req.body;
    const settings = await db.getSettings();
    let targetApp = null;

    if (targetAppId) {
      targetApp = await db.getApplicationById(targetAppId);
    } else {
      const allApps = await db.getAllApplications();
      const existing = allApps.find(
        a => a.company.toLowerCase() === (parsedData.extractedCompany || '').toLowerCase()
      );
      if (existing) {
        targetApp = existing;
      }
    }

    if (targetApp) {
      const updates = {
        lastContactDate: new Date().toISOString(),
        autoFollowUpAlertSent: false
      };
      if (parsedData.suggestedStatus && parsedData.suggestedStatus !== 'applied') {
        updates.status = parsedData.suggestedStatus;
      }

      await db.updateApplication(targetApp.id, updates);

      if (parsedData.interviewDetails) {
        await db.addInterview(targetApp.id, parsedData.interviewDetails);
      }
      if (parsedData.assessmentDetails) {
        await db.addAssessment(targetApp.id, parsedData.assessmentDetails);
      }

      await db.addEmailThread(targetApp.id, {
        subject: parsedData.subject,
        from: parsedData.from,
        date: parsedData.date || new Date().toISOString(),
        snippet: parsedData.snippet,
        fullBody: parsedData.fullBody
      });

      await db.logActivity('email_linked', `Linked email from ${parsedData.extractedCompany} to existing application`, targetApp.id);
      const refreshed = await db.getApplicationById(targetApp.id);
      return res.json({ success: true, action: 'updated', data: decorateApplication(refreshed, settings) });
    } else {
      const newApp = await db.createApplication({
        company: parsedData.extractedCompany || 'New Company',
        role: parsedData.extractedRole || 'Software Engineer',
        status: parsedData.suggestedStatus || 'applied',
        contactEmail: parsedData.from || '',
        contactName: parsedData.from ? parsedData.from.split('<')[0].replace(/"/g, '').trim() : '',
        source: 'Email Auto-Sync',
        notes: `Created automatically from email: "${parsedData.subject}"\n\n${parsedData.snippet}`,
        appliedDate: parsedData.date || new Date().toISOString(),
        lastContactDate: new Date().toISOString()
      });

      if (parsedData.interviewDetails) {
        await db.addInterview(newApp.id, parsedData.interviewDetails);
      }
      if (parsedData.assessmentDetails) {
        await db.addAssessment(newApp.id, parsedData.assessmentDetails);
      }

      await db.addEmailThread(newApp.id, {
        subject: parsedData.subject,
        from: parsedData.from,
        date: parsedData.date || new Date().toISOString(),
        snippet: parsedData.snippet,
        fullBody: parsedData.fullBody
      });

      await db.logActivity('email_app_created', `Auto-created job application for ${newApp.company} from parsed email`, newApp.id);
      const refreshed = await db.getApplicationById(newApp.id);
      return res.json({ success: true, action: 'created', data: decorateApplication(refreshed, settings) });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Alerts Log & Activity Log
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await db.getAlerts();
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/activity-logs', async (req, res) => {
  try {
    const logs = await db.getActivityLogs();
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const updated = await db.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Analytics & Overview Dashboard Stats
app.get('/api/stats', async (req, res) => {
  try {
    const settings = await db.getSettings();
    const rawApps = await db.getAllApplications();
    const apps = rawApps.map(a => decorateApplication(a, settings));

    const total = apps.length;
    const statusCounts = {
      applied: 0,
      'phone screening': 0,
      assessment: 0,
      interview: 0,
      offered: 0,
      'no response': 0,
      rejected: 0,
      withdrawn: 0
    };

    let totalInterviews = 0;
    let upcomingInterviews = [];
    let totalAssessments = 0;
    let pendingAssessments = [];
    let followUpsRequired = [];

    apps.forEach(app => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }

      if (app.needsFollowUp) {
        followUpsRequired.push(app);
      }

      if (app.interviews && app.interviews.length > 0) {
        totalInterviews += app.interviews.length;
        app.interviews.forEach(i => {
          if (i.status === 'scheduled') {
            upcomingInterviews.push({
              ...i,
              company: app.company,
              role: app.role,
              appId: app.id
            });
          }
        });
      }

      if (app.assessments && app.assessments.length > 0) {
        totalAssessments += app.assessments.length;
        app.assessments.forEach(a => {
          if (a.status === 'pending' || a.status === 'in_progress') {
            pendingAssessments.push({
              ...a,
              company: app.company,
              role: app.role,
              appId: app.id
            });
          }
        });
      }
    });

    const respondedApps = apps.filter(a => a.status !== 'applied' && a.status !== 'no response').length;
    const responseRate = total > 0 ? Math.round((respondedApps / total) * 100) : 0;
    const interviewConversion = total > 0 ? Math.round(((statusCounts.interview + statusCounts.offered) / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalApplications: total,
        statusCounts,
        responseRate,
        interviewConversion,
        totalInterviews,
        upcomingInterviews,
        totalAssessments,
        pendingAssessments,
        followUpsRequired,
        activeAlertsCount: followUpsRequired.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Run rules check + email auto-sync every 5 minutes in background
cron.schedule('*/5 * * * *', async () => {
  console.log('[Cron] Running scheduled checks: follow-up alerts, no-response rules, email auto-sync...');
  try {
    await executeRulesCheck();
  } catch (e) {
    console.error('[Cron Error - Rules]', e);
  }
  try {
    await executeEmailAutoSync();
  } catch (e) {
    console.error('[Cron Error - Email Sync]', e);
  }
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 TrackApply Pro API Server running on port ${PORT}`);
  console.log(`   Database: SQLite Relational Store (server/database.sqlite)`);
  console.log(`   Rules Engine: 5 working days alert + 14 days auto 'No response'`);
  console.log(`   Email Auto-Sync: Interview/assessment detection on every cron tick`);
  console.log(`====================================================`);
  try {
    await db.initPromise;
    const rulesRes = await executeRulesCheck();
    console.log(`[Startup Check] Auto-rules initialized:`, rulesRes);
    const syncRes = await executeEmailAutoSync();
    console.log(`[Startup Check] Email auto-sync complete:`, syncRes);
  } catch (e) {
    console.error('[Startup Check Error]', e);
  }
});
