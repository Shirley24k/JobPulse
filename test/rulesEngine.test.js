const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateWorkingDays,
  getStageReferenceDate,
  evaluateApplicationRules,
} = require('../server/rulesEngine');

test('working-day calculation excludes weekends', () => {
  assert.equal(
    calculateWorkingDays('2026-11-13T12:00:00Z', new Date('2026-11-20T12:00:00Z')),
    5
  );
});

test('application becomes eligible after 5 working days', () => {
  const evaluation = evaluateApplicationRules([
    {
      id: 'app-1',
      status: 'applied',
      lastContactDate: '2026-11-12T12:00:00Z',
      appliedDate: '2026-11-12T12:00:00Z',
      autoFollowUpAlertSent: false,
      autoNoResponseTriggered: false,
    },
  ], {
    followUpThresholdWorkingDays: 5,
    noResponseThresholdCalendarDays: 14,
  });

  assert.equal(evaluation.followUpAlertsNeeded.length, 1);
});

test('sent alert flag keeps follow-up visible without changing eligibility', () => {
  const evaluation = evaluateApplicationRules([
    {
      id: 'app-1',
      status: 'interview',
      lastContactDate: '2026-11-01T12:00:00Z',
      appliedDate: '2026-11-01T12:00:00Z',
      autoFollowUpAlertSent: true,
      autoNoResponseTriggered: false,
    },
  ], {
    followUpThresholdWorkingDays: 5,
    noResponseThresholdCalendarDays: 14,
  });

  assert.equal(evaluation.followUpAlertsNeeded.length, 1);
});

test('interview stage starts from the latest past interview date', () => {
  const reference = getStageReferenceDate({
    interviews: [
      { scheduledAt: '2026-11-10T14:00:00Z' },
      { scheduledAt: '2026-11-18T14:00:00Z' },
    ],
  }, 'interview', new Date('2026-11-19T12:00:00Z'));

  assert.equal(reference, '2026-11-18T14:00:00.000Z');
});

test('assessment stage starts from the latest past assigned date', () => {
  const reference = getStageReferenceDate({
    assessments: [
      { assignedDate: '2026-11-10' },
      { assignedDate: '2026-11-17' },
    ],
  }, 'assessment', new Date('2026-11-19T12:00:00Z'));

  assert.equal(reference, '2026-11-17T00:00:00.000Z');
});
