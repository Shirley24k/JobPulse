const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
const { calculateWorkingDays, calculateCalendarDays, evaluateApplicationRules } = require('./rulesEngine');
const emailService = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// Run rules check every 5 minutes in background
cron.schedule('*/5 * * * *', async () => {
  console.log('[Cron] Running scheduled 5-day follow-up & 14-day no-response checks...');
  try {
    await executeRulesCheck();
  } catch (e) {
    console.error('[Cron Error]', e);
  }
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 TrackApply Pro API Server running on port ${PORT}`);
  console.log(`   Database: SQLite Relational Store (server/database.sqlite)`);
  console.log(`   Rules Engine: 5 working days alert + 14 days auto 'No response'`);
  console.log(`====================================================`);
  try {
    await db.initPromise;
    const res = await executeRulesCheck();
    console.log(`[Startup Check] Auto-rules initialized:`, res);
  } catch (e) {
    console.error('[Startup Check Error]', e);
  }
});
