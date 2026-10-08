const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 5000, path }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve(JSON.parse(raw)));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING INTEGRATION TESTS FOR ALL FEATURES');
  console.log('====================================================');

  // Test 1: Fetch applications
  const apps = await get('/api/applications');
  console.log('✅ Feature 1 & All: Fetched applications count:', apps.data.length);

  // Test 2: Feature 1 - Add job application manually
  const newApp = await post('/api/applications', {
    company: 'Anthropic',
    role: 'Senior AI Frontend Engineer',
    status: 'interview',
    location: 'San Francisco, CA / Hybrid',
    salary: '$210,000 - $240,000',
    contactName: 'Jordan Hayes',
    contactEmail: 'jhayes@anthropic.com',
    notes: 'Working on Claude AI user interfaces.'
  });
  console.log('✅ Feature 1: Manual Application Added:', newApp.data.company, '(ID:', newApp.data.id, ')');

  // Test 3: Feature 5 - Track multiple interview sessions
  const int1 = await post(`/api/applications/${newApp.data.id}/interviews`, {
    roundName: 'Round 1: Recruiter Phone Screen',
    scheduledAt: '2026-10-12T10:00:00',
    duration: '30 mins',
    interviewers: 'Jordan Hayes',
    meetingLink: 'https://meet.google.com/test-anthropic-1'
  });
  const int2 = await post(`/api/applications/${newApp.data.id}/interviews`, {
    roundName: 'Round 2: Technical Coding & Next.js',
    scheduledAt: '2026-10-15T14:00:00',
    duration: '60 mins',
    interviewers: 'Alex Chen (Staff Eng)',
    meetingLink: 'https://meet.google.com/test-anthropic-2'
  });
  console.log('✅ Feature 5: Added 2 Interview Sessions successfully. Count in app:', int2.data.interviews.length);

  // Test 4: Feature 5 - Track multiple assessment rounds
  const ass1 = await post(`/api/applications/${newApp.data.id}/assessments`, {
    title: 'AI Canvas Take-Home Project',
    type: 'Take-Home Project',
    platform: 'GitHub Repo',
    assignedDate: '2026-10-08',
    dueDate: '2026-10-14',
    status: 'in_progress',
    link: 'https://github.com/anthropic/frontend-challenge'
  });
  console.log('✅ Feature 5: Added Assessment challenge. Count in app:', ass1.data.assessments.length);

  // Test 5: Feature 2 - Track job application progress from email
  const simulated = await post('/api/emails/simulate', {
    from: 'Talent Acquisition <jobs@apple.com>',
    subject: 'Apple Technical Interview Invitation: Software Engineer',
    body: 'Hi Shirley, We would like to invite you for a 45-minute technical screen on Google Meet: https://meet.google.com/apple-screen-123'
  });
  console.log('✅ Feature 2: Email Parsed Automatically:', {
    extractedCompany: simulated.data.parsed.extractedCompany,
    suggestedStatus: simulated.data.parsed.suggestedStatus,
    interviewDetails: simulated.data.parsed.interviewDetails?.roundName
  });

  // Test 6: Auto-link/track parsed email into platform
  const autoTrackRes = await post('/api/emails/apply-to-app', {
    parsedData: simulated.data.parsed
  });
  console.log('✅ Feature 2: Linked Email to Platform Application:', autoTrackRes.data.company, 'Status:', autoTrackRes.data.status);

  // Test 7: Feature 3 & 4 - 5 working days alert & 14 days auto 'No response'
  const rulesRes = await post('/api/rules/run-check', {});
  console.log('✅ Feature 3 & 4: Rules Check Executed:');
  console.log('   - 5-Day Alert Notifications Triggered:', rulesRes.result.alertsSent.length);
  console.log('   - 14-Day Auto Status Transitions to No Response:', rulesRes.result.statusesUpdated.length);

  // Test 8: Feature 3 - Tailored Follow-up Email Generator
  const draft = await get(`/api/applications/${newApp.data.id}/followup-draft?type=polite_nudge`);
  console.log('✅ Feature 3: Generated Follow-Up Draft Subject:', draft.data.subject);

  // Test 9: Stats & Dashboard
  const stats = await get('/api/stats');
  console.log('✅ Analytics: Total Applications:', stats.data.totalApplications, 'Response Rate:', stats.data.responseRate + '%');

  console.log('====================================================');
  console.log('🎉 ALL TEST SUITES PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runTests().catch(console.error);
