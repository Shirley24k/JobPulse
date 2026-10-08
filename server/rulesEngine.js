// Working days calculator and Automated Rules Engine

/**
 * Calculates number of working days (Monday - Friday) between two dates
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {number}
 */
function calculateWorkingDays(startDate, endDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (start > end) return 0;

  // Set times to midnight for clean day counting
  let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const final = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  let workingDays = 0;
  // Advance day by day (excluding start day if looking at elapsed, or inclusive)
  while (current < final) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      workingDays++;
    }
  }

  return workingDays;
}

/**
 * Calculates total calendar days between two dates
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {number}
 */
function calculateCalendarDays(startDate, endDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Evaluates rules on all applications and returns triggered actions
 * 1. 5 working days no response -> follow-up alert
 * 2. 14 calendar days (2 weeks) no response -> change status to 'no response'
 */
function evaluateApplicationRules(applications, settings = {}) {
  const followUpThresholdWorkingDays = settings.followUpThresholdWorkingDays || 5;
  const noResponseThresholdCalendarDays = settings.noResponseThresholdCalendarDays || 14;

  const followUpAlertsNeeded = [];
  const statusUpdatesNeeded = [];

  const now = new Date();

  applications.forEach(app => {
    // Reference date: last contact or applied date
    const refDate = app.lastContactDate || app.appliedDate || app.createdAt;
    const workingDaysElapsed = calculateWorkingDays(refDate, now);
    const calendarDaysElapsed = calculateCalendarDays(refDate, now);

    // Rule 1: 14 Days (2 weeks) without response for 'applied' status -> auto mark 'no response'
    if (
      app.status === 'applied' &&
      calendarDaysElapsed >= noResponseThresholdCalendarDays &&
      !app.autoNoResponseTriggered
    ) {
      statusUpdatesNeeded.push({
        appId: app.id,
        newStatus: 'no response',
        reason: `Automatically marked as 'No response' after 2 weeks (${calendarDaysElapsed} calendar days) without recruiter contact.`,
        daysElapsed: calendarDaysElapsed,
      });
    }

    // Rule 2: 5 Working Days without response -> Follow up alert
    // Eligible statuses: 'applied', 'phone screening' (if awaiting interview scheduling), 'interview' (if awaiting result), 'assessment' (if submitted and awaiting result)
    const isAwaitingResponse = ['applied', 'phone screening', 'interview', 'assessment'].includes(app.status);
    
    if (
      isAwaitingResponse &&
      workingDaysElapsed >= followUpThresholdWorkingDays &&
      !app.autoFollowUpAlertSent &&
      app.status !== 'no response' &&
      app.status !== 'rejected' &&
      app.status !== 'offered' &&
      app.status !== 'withdrawn'
    ) {
      followUpAlertsNeeded.push({
        appId: app.id,
        app,
        workingDaysElapsed,
        calendarDaysElapsed,
        refDate,
        reason: `No response after ${workingDaysElapsed} working days (${calendarDaysElapsed} calendar days). Recommended to send a polite follow-up email.`,
      });
    }
  });

  return {
    followUpAlertsNeeded,
    statusUpdatesNeeded,
  };
}

module.exports = {
  calculateWorkingDays,
  calculateCalendarDays,
  evaluateApplicationRules,
};
