const nodemailer = require('nodemailer');
const { parseEmail } = require('./emailParser');

// Sample simulated emails for testing & demonstration
const SAMPLE_RECRUITER_EMAILS = [
  {
    id: 'sim-1',
    from: 'Sarah Jenkins <sarah.jenkins@stripe.com>',
    subject: 'Invitation: Stripe Technical Architecture Interview - Senior Fullstack Engineer',
    date: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    body: `Hi Shirley,\n\nThank you for taking the time to speak with our talent partner earlier this week. The team was very impressed with your background!\n\nWe would love to invite you to our next stage: a 60-minute Technical Architecture & System Design Interview.\n\nPlease find the meeting link below:\nhttps://meet.google.com/abc-stripe-arch\n\nLooking forward to speaking with you!\n\nBest regards,\nSarah Jenkins\nEngineering Recruiting @ Stripe`,
  },
  {
    id: 'sim-2',
    from: 'Amazon Recruiting Team <no-reply@amazon.jobs>',
    subject: 'Amazon Online Assessment Invitation: Software Development Engineer II',
    date: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    body: `Dear Shirley,\n\nThank you for your interest in the Software Development Engineer II role at Amazon.\n\nAs the next step in our selection process, we invite you to complete the HackerRank technical assessment. This 90-minute assessment covers data structures, algorithms, and system problem solving.\n\nAssessment Link:\nhttps://www.hackerrank.com/amazon-sde-assessment-2026\n\nPlease complete this within 5 business days.\n\nSincerely,\nAmazon Talent Acquisition`,
  },
  {
    id: 'sim-3',
    from: 'David Miller <dmiller@google.com>',
    subject: 'Google Interview Update: Scheduling Round 2 Technical Screen',
    date: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    body: `Hello Shirley,\n\nGreat news! Following your initial phone screen, our hiring committee would like to move forward with a Round 2 Coding & Algorithms Interview for the Senior Software Engineer role.\n\nWe will be conducting the session via Google Meet:\nhttps://meet.google.com/xyz-goog-sde\n\nBest,\nDavid Miller\nStaff Technical Recruiter @ Google`,
  },
  {
    id: 'sim-4',
    from: 'Netflix Talent <talent@netflix.com>',
    subject: 'Your Application for Staff UI Engineer at Netflix',
    date: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    body: `Hi Shirley,\n\nWe have received your application for the Staff UI Engineer position at Netflix. Our engineering team is currently reviewing your resume and portfolio. We will follow up with next steps shortly.\n\nThanks,\nNetflix Recruiting`,
  },
  {
    id: 'sim-5',
    from: 'Recruiting Team <jobs@openai.com>',
    subject: 'Update on your application with OpenAI - Research Engineer',
    date: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    body: `Hi Shirley,\n\nThank you for your interest in joining OpenAI and for taking the time to apply. After careful consideration by our engineering leads, we have decided not to move forward with your application at this time due to high volume of applicants.\n\nWe wish you the very best in your search.\n\nSincerely,\nOpenAI Talent Team`,
  }
];

class EmailService {
  constructor() {
    this.simulatedInbox = [...SAMPLE_RECRUITER_EMAILS];
    this.sentAlerts = [];
  }

  /**
   * Create Nodemailer transporter based on settings
   */
  getTransporter(settings) {
    if (settings && settings.smtpHost && settings.smtpUser && settings.smtpPass) {
      return nodemailer.createTransporter({
        host: settings.smtpHost,
        port: parseInt(settings.smtpPort) || 587,
        secure: settings.smtpSecure || false,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass,
        },
      });
    }
    return null; // Will run in sandbox/preview mode
  }

  /**
   * Send 5 Working Days Follow-up Alert Email to the candidate
   */
  async sendFollowUpAlert({ toEmail, application, workingDaysElapsed, settings }) {
    const transporter = this.getTransporter(settings);
    const subject = `⚠️ Action Required: Follow up with ${application.company} (${application.role}) - 5 Working Days No Response`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0284c7, #6366f1); padding: 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; }
          .content { padding: 24px; line-height: 1.6; }
          .badge { display: inline-block; background: #f59e0b; color: #000; font-weight: 700; padding: 4px 10px; border-radius: 9999px; font-size: 12px; margin-bottom: 12px; }
          .card { background: #0f172a; border-radius: 8px; padding: 16px; border: 1px solid #334155; margin: 16px 0; }
          .btn { display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; margin-top: 12px; }
          .footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CareerPilot Application Alert</h1>
          </div>
          <div class="content">
            <span class="badge">${workingDaysElapsed} WORKING DAYS ELAPSED</span>
            <h2 style="margin-top: 0; color: #38bdf8;">Follow-Up Recommended</h2>
            <p>You haven't received an update for your application at <strong>${application.company}</strong> in <strong>${workingDaysElapsed} working days</strong>.</p>
            
            <div class="card">
              <p style="margin: 4px 0;"><strong>Company:</strong> ${application.company}</p>
              <p style="margin: 4px 0;"><strong>Role:</strong> ${application.role}</p>
              <p style="margin: 4px 0;"><strong>Current Status:</strong> <span style="text-transform: capitalize; color: #38bdf8;">${application.status}</span></p>
              <p style="margin: 4px 0;"><strong>Applied Date:</strong> ${application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Contact:</strong> ${application.contactName || 'Recruiting Team'} (${application.contactEmail || 'No email saved'})</p>
            </div>

            <p style="color: #cbd5e1; font-size: 14px;">Sending a polite, concise follow-up email increases your response rate by up to 40%.</p>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="http://localhost:5173" class="btn">Open Job Tracker & Send Follow-up</a>
            </div>
          </div>
          <div class="footer">
            Tracked automatically by TrackApply Pro • Configured alert threshold: 5 working days
          </div>
        </div>
      </body>
      </html>
    `;

    const alertRecord = {
      id: 'alert-' + Date.now(),
      sentAt: new Date().toISOString(),
      recipient: toEmail || settings.alertEmail || 'user@local.dev',
      subject,
      appId: application.id,
      company: application.company,
      workingDaysElapsed,
      htmlPreview: htmlContent,
      mode: transporter ? 'real_smtp' : 'local_sandbox'
    };

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"TrackApply Alerts" <${settings.smtpUser}>`,
          to: toEmail || settings.alertEmail,
          subject,
          html: htmlContent,
        });
        alertRecord.status = 'sent_successfully';
      } catch (err) {
        console.error('SMTP sending error:', err);
        alertRecord.status = 'smtp_error';
        alertRecord.error = err.message;
      }
    } else {
      alertRecord.status = 'simulated_and_stored';
    }

    this.sentAlerts.unshift(alertRecord);
    return alertRecord;
  }

  /**
   * Fetch all syncable emails (from simulator or IMAP) and parse them
   */
  async syncEmails(settings) {
    const parsedResults = [];

    for (const email of this.simulatedInbox) {
      const parsed = parseEmail(email);
      parsedResults.push({
        id: email.id,
        ...parsed,
      });
    }

    return parsedResults;
  }

  /**
   * Add a new email to simulated inbox and parse it instantly
   */
  receiveSimulatedEmail(emailData) {
    const newEmail = {
      id: 'sim-' + Date.now(),
      from: emailData.from || 'recruiter@company.com',
      subject: emailData.subject || 'Application Update',
      date: new Date().toISOString(),
      body: emailData.body || '',
    };
    this.simulatedInbox.unshift(newEmail);
    const parsed = parseEmail(newEmail);
    return {
      email: newEmail,
      parsed: {
        id: newEmail.id,
        ...parsed
      }
    };
  }

  /**
   * Generate tailored follow up email templates for user to copy or send to recruiter
   */
  generateFollowUpDraft(application, templateType = 'standard') {
    const company = application.company;
    const role = application.role;
    const contact = application.contactName || 'Hiring Team';

    if (templateType === 'polite_nudge') {
      return {
        subject: `Following up on application for ${role} - ${company}`,
        body: `Hi ${contact},\n\nI hope you're having a great week.\n\nI am writing to politely follow up on my application for the ${role} position at ${company}. I remain very enthusiastic about the opportunity and the team's mission.\n\nPlease let me know if there are any additional materials or details I can provide to assist in your review.\n\nThank you for your time and consideration!\n\nBest regards,\nShirley`
      };
    } else if (templateType === 'post_interview') {
      return {
        subject: `Thank you & Follow-up: ${role} Interview - ${company}`,
        body: `Hi ${contact},\n\nThank you again for coordinating my recent interview for the ${role} role. I really enjoyed learning more about ${company}'s current initiatives and technical roadmap.\n\nI wanted to check in on the hiring timeline and see if there are any next steps or updates the team can share.\n\nLooking forward to hearing from you!\n\nBest regards,\nShirley`
      };
    } else if (templateType === 'urgent_competing_offer') {
      return {
        subject: `Update regarding ${role} application - Timeline & Offer - ${company}`,
        body: `Hi ${contact},\n\nI hope all is well. I am checking in regarding my application for the ${role} position.\n\n${company} remains one of my top choices; however, I recently received another offer with an upcoming decision deadline. Since I am very interested in this role at ${company}, I wanted to inquire about where we stand in the process.\n\nThank you very much for your understanding and prompt update.\n\nBest regards,\nShirley`
      };
    }

    // Default standard template
    return {
      subject: `Inquiry regarding ${role} application status - ${company}`,
      body: `Dear ${contact},\n\nI hope this email finds you well.\n\nI recently applied for the ${role} position at ${company} and wanted to follow up on the status of my application. I am very excited about the possibility of contributing to your team with my engineering background.\n\nCould you please provide an update on the hiring timeline?\n\nThank you for your time and consideration.\n\nSincerely,\nShirley`
    };
  }
}

module.exports = new EmailService();
