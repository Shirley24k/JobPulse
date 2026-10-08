// Smart Email Parser for Job Applications

function extractDomainCompany(fromAddress = '') {
  if (!fromAddress) return '';
  const match = fromAddress.match(/@([a-zA-Z0-9.-]+)/);
  if (!match) return '';
  const domain = match[1].toLowerCase();
  // Filter common generic providers
  const genericProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'proton.me', 'greenhouse-mail.io', 'lever.co', 'workday.com', 'ashbyhq.com', 'smartrecruiters.com', 'breezy.hr', 'hirevue.com'];
  if (genericProviders.includes(domain)) return '';
  
  // Extract company part from domain, e.g. stripe.com -> Stripe, careers.google.com -> Google
  const parts = domain.split('.');
  if (parts.length >= 2) {
    const mainPart = parts.length > 2 && parts[0] === 'careers' ? parts[1] : parts[parts.length - 2];
    return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
  }
  return '';
}

function parseEmail(email) {
  const subject = email.subject || '';
  const body = email.body || email.text || email.snippet || '';
  const from = email.from || '';
  const date = email.date || new Date().toISOString();

  const combinedText = `${subject}\n${body}`.toLowerCase();

  let detectedType = 'unknown';
  let suggestedStatus = 'applied';
  let extractedCompany = extractDomainCompany(from);
  let extractedRole = '';
  let interviewDetails = null;
  let assessmentDetails = null;

  // 1. Company Detection from Subject / Text if not found in domain
  if (!extractedCompany) {
    const companyMatches = [
      /(?:at|with|from)\s+([A-Z][a-zA-Z0-9&.\s]{2,20}?)(?:\s+for|\s+team|\s+careers|\s+recruiting|[,\.!\?])/i,
      /([A-Z][a-zA-Z0-9&.\s]{2,20}?)\s+(?:Careers|Recruiting|Team|Talent|Hiring)/i,
      /Application to\s+([A-Z][a-zA-Z0-9&.\s]{2,20})/i,
    ];
    for (const regex of companyMatches) {
      const match = subject.match(regex) || body.match(regex);
      if (match && match[1]) {
        extractedCompany = match[1].trim();
        break;
      }
    }
  }

  // 2. Role Title Detection
  const roleMatches = [
    /(?:for the|for position of|role:|position:)\s+([A-Za-z\s\/\-#\+]{3,40}?)(?:\s+role|\s+position|\s+at|\s+with|[,\.!\n])/i,
    /(Senior|Junior|Staff|Lead|Principal|Full[\s-]Stack|Frontend|Backend|Software|Product|Data|DevOps|Security|Engineering|Cloud)\s+([A-Za-z\s\/\-#\+]{3,35})/i,
  ];
  for (const regex of roleMatches) {
    const match = subject.match(regex) || body.match(regex);
    if (match) {
      extractedRole = (match[0] || match[1]).replace(/^(for the|for position of|role:|position:)\s*/i, '').trim();
      break;
    }
  }
  if (!extractedRole) extractedRole = 'Software Engineer';

  // 3. Stage & Status Detection
  // Check Offer
  if (
    combinedText.includes('job offer') ||
    combinedText.includes('offer of employment') ||
    combinedText.includes('pleased to offer you the position') ||
    combinedText.includes('congratulations on your offer')
  ) {
    detectedType = 'offer';
    suggestedStatus = 'offered';
  }
  // Check Rejection
  else if (
    combinedText.includes('unfortunately') ||
    combinedText.includes('decided to pursue other candidates') ||
    combinedText.includes('not moving forward') ||
    combinedText.includes('unable to offer you an interview') ||
    combinedText.includes('will not be moving forward') ||
    combinedText.includes('after careful consideration')
  ) {
    detectedType = 'rejection';
    suggestedStatus = 'rejected';
  }
  // Check Interview
  else if (
    combinedText.includes('interview') ||
    combinedText.includes('schedule a call') ||
    combinedText.includes('phone screen') ||
    combinedText.includes('invitation to meet') ||
    combinedText.includes('technical discussion') ||
    combinedText.includes('system design') ||
    combinedText.includes('google meet') ||
    combinedText.includes('zoom.us') ||
    combinedText.includes('calendly.com')
  ) {
    if (combinedText.includes('phone screen') || combinedText.includes('recruiter chat') || combinedText.includes('introductory call')) {
      detectedType = 'phone_screening';
      suggestedStatus = 'phone screening';
    } else {
      detectedType = 'interview_invitation';
      suggestedStatus = 'interview';
    }

    // Extract interview details
    const meetMatch = body.match(/https:\/\/(?:meet\.google\.com|[\w-]+\.zoom\.us\/j|calendly\.com)[^\s>"'\)]+/i);
    const roundNameMatch = body.match(/(Technical Screen|Coding Round|System Design|Recruiter Chat|Hiring Manager Round|Behavioral Round|Onsite Interview|Round \d+)/i);

    interviewDetails = {
      roundName: roundNameMatch ? roundNameMatch[1] : (suggestedStatus === 'phone screening' ? 'Phone Screening' : 'Technical Interview'),
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T14:00:00', // suggested default date
      duration: '45 mins',
      meetingLink: meetMatch ? meetMatch[0] : '',
      interviewers: from.split('<')[0].replace(/"/g, '').trim() || 'Hiring Team',
      status: 'scheduled',
      notes: `Extracted automatically from email: "${subject}"`
    };
  }
  // Check Assessment
  else if (
    combinedText.includes('hackerrank') ||
    combinedText.includes('codesignal') ||
    combinedText.includes('codility') ||
    combinedText.includes('take-home') ||
    combinedText.includes('take home') ||
    combinedText.includes('coding challenge') ||
    combinedText.includes('online assessment') ||
    combinedText.includes('technical assessment') ||
    combinedText.includes('testgorilla')
  ) {
    detectedType = 'assessment_assigned';
    suggestedStatus = 'assessment';

    let platform = 'Take-Home Project';
    if (combinedText.includes('hackerrank')) platform = 'HackerRank';
    else if (combinedText.includes('codesignal')) platform = 'CodeSignal';
    else if (combinedText.includes('codility')) platform = 'Codility';
    else if (combinedText.includes('testgorilla')) platform = 'TestGorilla';
    else if (combinedText.includes('leetcode')) platform = 'LeetCode';

    const testLinkMatch = body.match(/https:\/\/(?:www\.hackerrank\.com|app\.codesignal\.com|app\.codility\.com|github\.com)[^\s>"'\)]+/i);

    assessmentDetails = {
      title: `${platform} Coding Challenge`,
      type: platform === 'Take-Home Project' ? 'Take-Home Project' : 'Online Assessment',
      platform,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      link: testLinkMatch ? testLinkMatch[0] : '',
      notes: `Extracted from email: "${subject}"`
    };
  }
  // Check Application confirmation
  else if (
    combinedText.includes('application received') ||
    combinedText.includes('thank you for applying') ||
    combinedText.includes('thanks for applying') ||
    combinedText.includes('we have received your application') ||
    combinedText.includes('application submitted')
  ) {
    detectedType = 'application_received';
    suggestedStatus = 'applied';
  } else {
    detectedType = 'general_update';
    suggestedStatus = 'applied';
  }

  return {
    parsedAt: new Date().toISOString(),
    from,
    subject,
    date,
    detectedType,
    suggestedStatus,
    extractedCompany: extractedCompany || 'Unknown Company',
    extractedRole: extractedRole || 'Software Engineer',
    snippet: body.substring(0, 200) + (body.length > 200 ? '...' : ''),
    fullBody: body,
    interviewDetails,
    assessmentDetails,
    confidence: extractedCompany ? 0.9 : 0.6
  };
}

module.exports = {
  parseEmail,
  extractDomainCompany
};
