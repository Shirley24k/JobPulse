const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const OLD_JSON_PATH = path.join(__dirname, 'data.json');

class Database {
  constructor() {
    this.initPromise = new Promise((resolve) => {
      this.db = new sqlite3.Database(DB_PATH, async (err) => {
        if (err) {
          console.error('❌ Failed to connect to SQLite database:', err.message);
        } else {
          console.log(`✅ SQLite Database connected at: ${DB_PATH}`);
          await this.init();
          resolve();
        }
      });
    });
  }

  // Helper to run query with Promises
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async init() {
    try {
      // Enable foreign keys
      await this.run('PRAGMA foreign_keys = ON;');

      // 1. Applications Table
      await this.run(`
        CREATE TABLE IF NOT EXISTS applications (
          id TEXT PRIMARY KEY,
          company TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'applied',
          location TEXT,
          salary TEXT,
          job_url TEXT,
          applied_date TEXT NOT NULL,
          last_contact_date TEXT,
          last_status_update_date TEXT,
          notes TEXT,
          contact_name TEXT,
          contact_email TEXT,
          resume_version TEXT,
          source TEXT,
          auto_followup_alert_sent INTEGER DEFAULT 0,
          auto_no_response_triggered INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT
        )
      `);

      // 2. Interviews Table (Multi-round support)
      await this.run(`
        CREATE TABLE IF NOT EXISTS interviews (
          id TEXT PRIMARY KEY,
          application_id TEXT NOT NULL,
          round_number INTEGER NOT NULL,
          round_name TEXT NOT NULL,
          scheduled_at TEXT NOT NULL,
          duration TEXT,
          interviewers TEXT,
          meeting_link TEXT,
          status TEXT NOT NULL DEFAULT 'scheduled',
          notes TEXT,
          feedback TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
        )
      `);

      // 3. Assessments Table (Multi-test support)
      await this.run(`
        CREATE TABLE IF NOT EXISTS assessments (
          id TEXT PRIMARY KEY,
          application_id TEXT NOT NULL,
          title TEXT NOT NULL,
          type TEXT,
          platform TEXT,
          assigned_date TEXT,
          due_date TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          link TEXT,
          notes TEXT,
          submitted_at TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
        )
      `);

      // 4. Email Threads Table
      await this.run(`
        CREATE TABLE IF NOT EXISTS email_threads (
          id TEXT PRIMARY KEY,
          application_id TEXT,
          subject TEXT NOT NULL,
          sender TEXT,
          date TEXT,
          snippet TEXT,
          full_body TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
        )
      `);

      // 5. Follow-Up History Table
      await this.run(`
        CREATE TABLE IF NOT EXISTS followup_history (
          id TEXT PRIMARY KEY,
          application_id TEXT NOT NULL,
          type TEXT NOT NULL,
          subject TEXT,
          body TEXT,
          sent_to TEXT,
          date TEXT NOT NULL,
          FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
        )
      `);

      // 6. Settings Table (Key-Value)
      await this.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
      await this.run(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
        ['lastEmailSyncCheckpoint', JSON.stringify(null)]
      );

      // 7. Alerts Log Table
      await this.run(`
        CREATE TABLE IF NOT EXISTS alerts (
          id TEXT PRIMARY KEY,
          application_id TEXT,
          company TEXT,
          recipient TEXT,
          subject TEXT,
          working_days_elapsed INTEGER,
          html_preview TEXT,
          mode TEXT,
          status TEXT,
          sent_at TEXT NOT NULL
        )
      `);

      // 8. Activity Logs Table
      await this.run(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY,
          application_id TEXT,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp TEXT NOT NULL
        )
      `);

      // Seed initial data if empty
      await this.seedInitialData();
    } catch (err) {
      console.error('Error during SQLite table initialization:', err);
    }
  }

  async seedInitialData() {
    const existingApps = await this.all('SELECT COUNT(*) as count FROM applications');
    if (existingApps[0].count > 0) return;

    console.log('🌱 Seeding initial records into SQLite relational database...');

    // Default settings
    const defaultSettings = {
      alertEmail: 'candidate@example.com',
      followUpThresholdWorkingDays: 5,
      noResponseThresholdCalendarDays: 14,
      autoSendFollowUpAlerts: true,
      autoMarkNoResponse: true,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      smtpSecure: false,
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      imapUser: '',
      imapPass: '',
      lastEmailSyncCheckpoint: null,
      theme: 'dark'
    };

    for (const [k, v] of Object.entries(defaultSettings)) {
      await this.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, JSON.stringify(v)]);
    }

    // Check if previous data.json exists to migrate
    let seedList = [];
    if (fs.existsSync(OLD_JSON_PATH)) {
      try {
        const raw = fs.readFileSync(OLD_JSON_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.applications && parsed.applications.length > 0) {
          seedList = parsed.applications;
        }
      } catch (e) {
        // ignore
      }
    }

    if (seedList.length === 0) {
      seedList = [
        {
          id: 'app-1',
          company: 'Stripe',
          role: 'Senior Full Stack Engineer',
          status: 'interview',
          location: 'Remote (US/Global)',
          salary: '$180,000 - $210,000 + Equity',
          jobUrl: 'https://stripe.com/jobs/senior-fullstack-dev',
          appliedDate: '2026-09-20T10:00:00.000Z',
          lastContactDate: '2026-10-06T15:30:00.000Z',
          notes: 'Great culture, highly scalable payment infra. Team uses React, TypeScript, Ruby, Go.',
          contactName: 'Sarah Jenkins',
          contactEmail: 'sarah.jenkins@stripe.com',
          resumeVersion: 'FullStack_Staff_2026.pdf',
          source: 'Referral',
          interviews: [
            {
              id: 'int-1-1',
              roundNumber: 1,
              roundName: 'Recruiter Screening',
              scheduledAt: '2026-09-26T15:00:00',
              duration: '30 mins',
              interviewers: 'Sarah Jenkins (Talent Partner)',
              meetingLink: 'https://meet.google.com/abc-stripe-screen',
              status: 'completed',
              notes: 'Discussed past distributed systems experience and salary expectations.',
              feedback: 'Passed! Recruiter moved me to technical rounds.'
            },
            {
              id: 'int-1-2',
              roundNumber: 2,
              roundName: 'Live Coding & Algorithms',
              scheduledAt: '2026-10-02T16:00:00',
              duration: '60 mins',
              interviewers: 'Marcus Vance (Staff Eng)',
              meetingLink: 'https://meet.google.com/abc-stripe-livecode',
              status: 'completed',
              notes: 'Solved concurrency rate limiter problem. Positive vibe.',
              feedback: 'Strong performance on edge cases.'
            },
            {
              id: 'int-1-3',
              roundNumber: 3,
              roundName: 'System Architecture & Design',
              scheduledAt: '2026-10-10T14:00:00',
              duration: '60 mins',
              interviewers: 'Elena Rostova (Principal Architect)',
              meetingLink: 'https://meet.google.com/abc-stripe-arch',
              status: 'scheduled',
              notes: 'Preparing Webhook delivery idempotency and event streaming architectures.',
              feedback: ''
            }
          ],
          assessments: [
            {
              id: 'ass-1-1',
              title: 'API Design Take-Home Challenge',
              type: 'Take-Home Project',
              platform: 'GitHub Repo',
              assignedDate: '2026-09-27',
              dueDate: '2026-10-01',
              status: 'submitted',
              link: 'https://github.com/shirley/stripe-idempotent-api-challenge',
              notes: 'Built idempotent payment webhook handler with Redis.',
              submittedAt: '2026-09-30T18:00:00.000Z'
            }
          ]
        },
        {
          id: 'app-2',
          company: 'Amazon',
          role: 'Software Development Engineer II (AWS)',
          status: 'assessment',
          location: 'Seattle, WA (Hybrid)',
          salary: '$165,000 - $195,000 + RSU',
          jobUrl: 'https://amazon.jobs/en/jobs/2458921',
          appliedDate: '2026-10-01T08:30:00.000Z',
          lastContactDate: '2026-10-03T11:00:00.000Z',
          notes: 'AWS CloudFront edge routing optimization team.',
          contactName: 'Amazon Talent Acquisition',
          contactEmail: 'no-reply@amazon.jobs',
          resumeVersion: 'Cloud_Distributed_Resume.pdf',
          source: 'LinkedIn',
          interviews: [],
          assessments: [
            {
              id: 'ass-2-1',
              title: 'HackerRank 90-min Coding OA',
              type: 'Online Assessment',
              platform: 'HackerRank',
              assignedDate: '2026-10-03',
              dueDate: '2026-10-10',
              status: 'in_progress',
              link: 'https://www.hackerrank.com/amazon-sde-assessment-2026',
              notes: '2 questions: Dynamic Programming + Graph traversal.',
              submittedAt: ''
            }
          ]
        },
        {
          id: 'app-3',
          company: 'Airbnb',
          role: 'Staff Frontend Engineer',
          status: 'applied',
          location: 'San Francisco, CA / Remote',
          salary: '$190,000 - $225,000',
          jobUrl: 'https://careers.airbnb.com/positions/staff-fe',
          appliedDate: '2026-09-28T09:00:00.000Z',
          lastContactDate: '2026-09-28T09:00:00.000Z',
          notes: 'Design Systems & Core UI infrastructure team.',
          contactName: 'Jessica Wu (Lead Recruiter)',
          contactEmail: 'jessica.wu@airbnb.com',
          resumeVersion: 'Frontend_Staff_Resume.pdf',
          source: 'Company Portal',
          interviews: [],
          assessments: []
        },
        {
          id: 'app-4',
          company: 'Dropbox',
          role: 'Backend Infrastructure Engineer',
          status: 'no response',
          location: 'Remote',
          salary: '$170,000 - $195,000',
          jobUrl: 'https://dropbox.com/jobs/backend-infra',
          appliedDate: '2026-09-18T14:20:00.000Z',
          lastContactDate: '2026-09-18T14:20:00.000Z',
          notes: 'Applied via referral portal.',
          contactName: 'Dropbox Recruiting',
          contactEmail: 'talent@dropbox.com',
          resumeVersion: 'FullStack_Staff_2026.pdf',
          source: 'LinkedIn',
          autoNoResponseTriggered: true,
          interviews: [],
          assessments: []
        },
        {
          id: 'app-5',
          company: 'Datadog',
          role: 'Senior Software Engineer - APM',
          status: 'phone screening',
          location: 'New York, NY / Hybrid',
          salary: '$175,000 - $200,000',
          jobUrl: 'https://careers.datadoghq.com/sde-apm',
          appliedDate: '2026-10-02T11:00:00.000Z',
          lastContactDate: '2026-10-05T16:00:00.000Z',
          notes: 'Phone screen scheduled for tomorrow.',
          contactName: 'Liam O\'Connor',
          contactEmail: 'liam.oconnor@datadoghq.com',
          resumeVersion: 'Cloud_Distributed_Resume.pdf',
          source: 'Recruiter Outreach',
          interviews: [
            {
              id: 'int-5-1',
              roundNumber: 1,
              roundName: 'Recruiter Phone Screen',
              scheduledAt: '2026-10-09T11:00:00',
              duration: '30 mins',
              interviewers: 'Liam O\'Connor',
              meetingLink: 'tel:+14155552671',
              status: 'scheduled',
              notes: 'Discuss motivation and telemetry background.',
              feedback: ''
            }
          ],
          assessments: []
        },
        {
          id: 'app-6',
          company: 'Figma',
          role: 'Product Engineer - Canvas & Collaboration',
          status: 'offered',
          location: 'San Francisco, CA / Hybrid',
          salary: '$205,000 + $80,000 equity/yr',
          jobUrl: 'https://figma.com/careers/pe-canvas',
          appliedDate: '2026-08-25T10:00:00.000Z',
          lastContactDate: '2026-10-04T17:00:00.000Z',
          notes: 'Fantastic team! Offer letter received.',
          contactName: 'Claire Reynolds (Staff Recruiter)',
          contactEmail: 'creynolds@figma.com',
          resumeVersion: 'Frontend_Staff_Resume.pdf',
          source: 'Referral',
          interviews: [
            {
              id: 'int-6-1',
              roundNumber: 1,
              roundName: 'Recruiter Screen',
              scheduledAt: '2026-09-02T10:00:00',
              duration: '30 mins',
              interviewers: 'Claire Reynolds',
              meetingLink: '',
              status: 'completed',
              notes: 'Initial alignment on product craft.',
              feedback: 'Fast-tracked.'
            },
            {
              id: 'int-6-2',
              roundNumber: 2,
              roundName: 'Technical Coding',
              scheduledAt: '2026-09-10T14:00:00',
              duration: '60 mins',
              interviewers: 'Jordan Lee',
              meetingLink: '',
              status: 'completed',
              notes: 'Wasm and WebGL rendering optimization.',
              feedback: 'Strong hire.'
            }
          ],
          assessments: []
        }
      ];
    }

    for (const app of seedList) {
      await this.createApplication(app);
    }

    await this.logActivity('system', 'SQLite database initialized with relational schema and records.');
  }

  // Helper to map DB row to Application Object
  mapAppRow(row, interviews = [], assessments = [], emailThreads = [], followUpHistory = []) {
    if (!row) return null;
    return {
      id: row.id,
      company: row.company,
      role: row.role,
      status: row.status,
      location: row.location || '',
      salary: row.salary || '',
      jobUrl: row.job_url || '',
      appliedDate: row.applied_date,
      lastContactDate: row.last_contact_date || row.applied_date,
      lastStatusUpdateDate: row.last_status_update_date,
      notes: row.notes || '',
      contactName: row.contact_name || '',
      contactEmail: row.contact_email || '',
      resumeVersion: row.resume_version || '',
      source: row.source || '',
      autoFollowUpAlertSent: Boolean(row.auto_followup_alert_sent),
      autoNoResponseTriggered: Boolean(row.auto_no_response_triggered),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      interviews: interviews.map(i => ({
        id: i.id,
        roundNumber: i.round_number,
        roundName: i.round_name,
        scheduledAt: i.scheduled_at,
        duration: i.duration,
        interviewers: i.interviewers,
        meetingLink: i.meeting_link,
        status: i.status,
        notes: i.notes,
        feedback: i.feedback
      })),
      assessments: assessments.map(a => ({
        id: a.id,
        title: a.title,
        type: a.type,
        platform: a.platform,
        assignedDate: a.assigned_date,
        dueDate: a.due_date,
        status: a.status,
        link: a.link,
        notes: a.notes,
        submittedAt: a.submitted_at
      })),
      emailThreads: emailThreads.map(e => ({
        id: e.id,
        subject: e.subject,
        from: e.sender,
        date: e.date,
        snippet: e.snippet,
        fullBody: e.full_body
      })),
      followUpHistory: followUpHistory.map(f => ({
        id: f.id,
        type: f.type,
        subject: f.subject,
        body: f.body,
        sentTo: f.sent_to,
        date: f.date
      }))
    };
  }

  // Application CRUD
  async getAllApplications() {
    const rows = await this.all('SELECT * FROM applications ORDER BY created_at DESC');
    const apps = [];

    for (const row of rows) {
      const [interviews, assessments, emailThreads, followUpHistory] = await Promise.all([
        this.all('SELECT * FROM interviews WHERE application_id = ? ORDER BY round_number ASC', [row.id]),
        this.all('SELECT * FROM assessments WHERE application_id = ? ORDER BY created_at ASC', [row.id]),
        this.all('SELECT * FROM email_threads WHERE application_id = ? ORDER BY date DESC', [row.id]),
        this.all('SELECT * FROM followup_history WHERE application_id = ? ORDER BY date DESC', [row.id])
      ]);

      apps.push(this.mapAppRow(row, interviews, assessments, emailThreads, followUpHistory));
    }

    return apps;
  }

  async getApplicationById(id) {
    const row = await this.get('SELECT * FROM applications WHERE id = ?', [id]);
    if (!row) return null;

    const [interviews, assessments, emailThreads, followUpHistory] = await Promise.all([
      this.all('SELECT * FROM interviews WHERE application_id = ? ORDER BY round_number ASC', [id]),
      this.all('SELECT * FROM assessments WHERE application_id = ? ORDER BY created_at ASC', [id]),
      this.all('SELECT * FROM email_threads WHERE application_id = ? ORDER BY date DESC', [id]),
      this.all('SELECT * FROM followup_history WHERE application_id = ? ORDER BY date DESC', [id])
    ]);

    return this.mapAppRow(row, interviews, assessments, emailThreads, followUpHistory);
  }

  async createApplication(appData) {
    const id = appData.id || ('app-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4));
    const now = new Date().toISOString();

    await this.run(`
      INSERT INTO applications (
        id, company, role, status, location, salary, job_url, applied_date,
        last_contact_date, last_status_update_date, notes, contact_name, contact_email,
        resume_version, source, auto_followup_alert_sent, auto_no_response_triggered, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      appData.company || 'Untitled Company',
      appData.role || 'Software Engineer',
      appData.status || 'applied',
      appData.location || '',
      appData.salary || '',
      appData.jobUrl || '',
      appData.appliedDate || now,
      appData.lastContactDate || appData.appliedDate || now,
      appData.lastStatusUpdateDate || now,
      appData.notes || '',
      appData.contactName || '',
      appData.contactEmail || '',
      appData.resumeVersion || 'Main Resume',
      appData.source || 'Manual Entry',
      appData.autoFollowUpAlertSent ? 1 : 0,
      appData.autoNoResponseTriggered ? 1 : 0,
      appData.createdAt || now,
      now
    ]);

    // Insert interviews if any
    if (Array.isArray(appData.interviews)) {
      for (const i of appData.interviews) {
        await this.addInterview(id, i);
      }
    }

    // Insert assessments if any
    if (Array.isArray(appData.assessments)) {
      for (const a of appData.assessments) {
        await this.addAssessment(id, a);
      }
    }

    await this.logActivity('created', `Added application for ${appData.role} at ${appData.company}`, id);
    return await this.getApplicationById(id);
  }

  async updateApplication(id, updates) {
    const oldApp = await this.getApplicationById(id);
    if (!oldApp) return null;

    const company = updates.company !== undefined ? updates.company : oldApp.company;
    const role = updates.role !== undefined ? updates.role : oldApp.role;
    const status = updates.status !== undefined ? updates.status : oldApp.status;
    const location = updates.location !== undefined ? updates.location : oldApp.location;
    const salary = updates.salary !== undefined ? updates.salary : oldApp.salary;
    const jobUrl = updates.jobUrl !== undefined ? updates.jobUrl : oldApp.jobUrl;
    const appliedDate = updates.appliedDate !== undefined ? updates.appliedDate : oldApp.appliedDate;
    const lastContactDate = updates.lastContactDate !== undefined ? updates.lastContactDate : oldApp.lastContactDate;
    const notes = updates.notes !== undefined ? updates.notes : oldApp.notes;
    const contactName = updates.contactName !== undefined ? updates.contactName : oldApp.contactName;
    const contactEmail = updates.contactEmail !== undefined ? updates.contactEmail : oldApp.contactEmail;
    const resumeVersion = updates.resumeVersion !== undefined ? updates.resumeVersion : oldApp.resumeVersion;
    const source = updates.source !== undefined ? updates.source : oldApp.source;
    const autoFollowUpAlertSent = updates.autoFollowUpAlertSent !== undefined ? (updates.autoFollowUpAlertSent ? 1 : 0) : (oldApp.autoFollowUpAlertSent ? 1 : 0);
    const autoNoResponseTriggered = updates.autoNoResponseTriggered !== undefined ? (updates.autoNoResponseTriggered ? 1 : 0) : (oldApp.autoNoResponseTriggered ? 1 : 0);
    const now = new Date().toISOString();
    const lastStatusUpdateDate = (updates.status && updates.status !== oldApp.status) ? now : oldApp.lastStatusUpdateDate;

    await this.run(`
      UPDATE applications SET
        company = ?, role = ?, status = ?, location = ?, salary = ?, job_url = ?,
        applied_date = ?, last_contact_date = ?, last_status_update_date = ?, notes = ?,
        contact_name = ?, contact_email = ?, resume_version = ?, source = ?,
        auto_followup_alert_sent = ?, auto_no_response_triggered = ?, updated_at = ?
      WHERE id = ?
    `, [
      company, role, status, location, salary, jobUrl, appliedDate, lastContactDate,
      lastStatusUpdateDate, notes, contactName, contactEmail, resumeVersion, source,
      autoFollowUpAlertSent, autoNoResponseTriggered, now, id
    ]);

    if (updates.status && updates.status !== oldApp.status) {
      await this.logActivity('status_change', `Status changed from '${oldApp.status}' to '${updates.status}' for ${company}`, id);
    }

    return await this.getApplicationById(id);
  }

  async deleteApplication(id) {
    const app = await this.getApplicationById(id);
    if (!app) return false;

    await this.run('DELETE FROM applications WHERE id = ?', [id]);
    await this.logActivity('deleted', `Deleted application for ${app.company}`, id);
    return true;
  }

  // Interview Management
  async addInterview(appId, interview) {
    const intId = interview.id || ('int-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4));
    const countRow = await this.get('SELECT COUNT(*) as count FROM interviews WHERE application_id = ?', [appId]);
    const roundNumber = interview.roundNumber || (countRow.count + 1);

    await this.run(`
      INSERT INTO interviews (
        id, application_id, round_number, round_name, scheduled_at, duration,
        interviewers, meeting_link, status, notes, feedback, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      intId,
      appId,
      roundNumber,
      interview.roundName || `Interview Round ${roundNumber}`,
      interview.scheduledAt || new Date().toISOString(),
      interview.duration || '45 mins',
      interview.interviewers || '',
      interview.meetingLink || '',
      interview.status || 'scheduled',
      interview.notes || '',
      interview.feedback || '',
      new Date().toISOString()
    ]);

    // Update app last contact
    await this.run('UPDATE applications SET last_contact_date = ?, status = ? WHERE id = ?', [
      new Date().toISOString(),
      'interview',
      appId
    ]);

    await this.logActivity('interview_added', `Added interview round for application`, appId);
    return await this.getApplicationById(appId);
  }

  async updateInterview(appId, intId, updates) {
    const current = await this.get('SELECT * FROM interviews WHERE id = ? AND application_id = ?', [intId, appId]);
    if (!current) return null;

    await this.run(`
      UPDATE interviews SET
        round_name = ?, scheduled_at = ?, duration = ?, interviewers = ?,
        meeting_link = ?, status = ?, notes = ?, feedback = ?
      WHERE id = ? AND application_id = ?
    `, [
      updates.roundName !== undefined ? updates.roundName : current.round_name,
      updates.scheduledAt !== undefined ? updates.scheduledAt : current.scheduled_at,
      updates.duration !== undefined ? updates.duration : current.duration,
      updates.interviewers !== undefined ? updates.interviewers : current.interviewers,
      updates.meetingLink !== undefined ? updates.meetingLink : current.meeting_link,
      updates.status !== undefined ? updates.status : current.status,
      updates.notes !== undefined ? updates.notes : current.notes,
      updates.feedback !== undefined ? updates.feedback : current.feedback,
      intId,
      appId
    ]);

    return await this.getApplicationById(appId);
  }

  async deleteInterview(appId, intId) {
    await this.run('DELETE FROM interviews WHERE id = ? AND application_id = ?', [intId, appId]);
    return await this.getApplicationById(appId);
  }

  // Assessment Management
  async addAssessment(appId, assessment) {
    const assId = assessment.id || ('ass-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4));

    await this.run(`
      INSERT INTO assessments (
        id, application_id, title, type, platform, assigned_date, due_date,
        status, link, notes, submitted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      assId,
      appId,
      assessment.title || 'Technical Assessment',
      assessment.type || 'Online Assessment',
      assessment.platform || 'HackerRank',
      assessment.assignedDate || new Date().toISOString().split('T')[0],
      assessment.dueDate || '',
      assessment.status || 'pending',
      assessment.link || '',
      assessment.notes || '',
      assessment.submittedAt || '',
      new Date().toISOString()
    ]);

    await this.run('UPDATE applications SET last_contact_date = ?, status = ? WHERE id = ?', [
      new Date().toISOString(),
      'assessment',
      appId
    ]);

    await this.logActivity('assessment_added', `Added assessment for application`, appId);
    return await this.getApplicationById(appId);
  }

  async updateAssessment(appId, assId, updates) {
    const current = await this.get('SELECT * FROM assessments WHERE id = ? AND application_id = ?', [assId, appId]);
    if (!current) return null;

    await this.run(`
      UPDATE assessments SET
        title = ?, type = ?, platform = ?, assigned_date = ?, due_date = ?,
        status = ?, link = ?, notes = ?, submitted_at = ?
      WHERE id = ? AND application_id = ?
    `, [
      updates.title !== undefined ? updates.title : current.title,
      updates.type !== undefined ? updates.type : current.type,
      updates.platform !== undefined ? updates.platform : current.platform,
      updates.assignedDate !== undefined ? updates.assignedDate : current.assigned_date,
      updates.dueDate !== undefined ? updates.dueDate : current.due_date,
      updates.status !== undefined ? updates.status : current.status,
      updates.link !== undefined ? updates.link : current.link,
      updates.notes !== undefined ? updates.notes : current.notes,
      updates.submittedAt !== undefined ? updates.submittedAt : current.submitted_at,
      assId,
      appId
    ]);

    return await this.getApplicationById(appId);
  }

  async deleteAssessment(appId, assId) {
    await this.run('DELETE FROM assessments WHERE id = ? AND application_id = ?', [assId, appId]);
    return await this.getApplicationById(appId);
  }

  // Settings (Key-Value)
  async getSettings() {
    const rows = await this.all('SELECT * FROM settings');
    const settingsObj = {};
    for (const row of rows) {
      try {
        settingsObj[row.key] = JSON.parse(row.value);
      } catch (e) {
        settingsObj[row.key] = row.value;
      }
    }
    return settingsObj;
  }

  async updateSettings(newSettings) {
    for (const [key, value] of Object.entries(newSettings)) {
      await this.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        key,
        JSON.stringify(value)
      ]);
    }
    return await this.getSettings();
  }

  // Alerts & Activity Logs
  async addAlert(alert) {
    await this.run(`
      INSERT INTO alerts (
        id, application_id, company, recipient, subject, working_days_elapsed,
        html_preview, mode, status, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      alert.id || ('alert-' + Date.now()),
      alert.appId || '',
      alert.company || '',
      alert.recipient || '',
      alert.subject || '',
      alert.workingDaysElapsed || 0,
      alert.htmlPreview || '',
      alert.mode || 'local_sandbox',
      alert.status || 'recorded',
      alert.sentAt || new Date().toISOString()
    ]);
    return alert;
  }

  async getAlerts() {
    return await this.all('SELECT * FROM alerts ORDER BY sent_at DESC');
  }

  async logActivity(type, message, appId = null) {
    const log = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      type,
      message,
      appId
    };
    await this.run('INSERT INTO activity_logs (id, application_id, type, message, timestamp) VALUES (?, ?, ?, ?, ?)', [
      log.id,
      appId,
      type,
      message,
      log.timestamp
    ]);
    return log;
  }

  async getActivityLogs() {
    return await this.all('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 200');
  }

  async addEmailThread(appId, email) {
    const id = 'em-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    await this.run(`
      INSERT INTO email_threads (id, application_id, subject, sender, date, snippet, full_body, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      appId,
      email.subject,
      email.from,
      email.date || new Date().toISOString(),
      email.snippet,
      email.fullBody,
      new Date().toISOString()
    ]);
  }

  async addFollowUpHistory(appId, entry) {
    const id = entry.id || ('flw-' + Date.now());
    await this.run(`
      INSERT INTO followup_history (id, application_id, type, subject, body, sent_to, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      appId,
      entry.type || 'email_sent',
      entry.subject || '',
      entry.body || '',
      entry.sentTo || '',
      entry.date || new Date().toISOString()
    ]);
  }
}

module.exports = new Database();
