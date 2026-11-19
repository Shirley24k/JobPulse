const test = require('node:test');
const assert = require('node:assert/strict');
const emailService = require('../server/emailService');

test('SMTP settings create a Nodemailer transporter', () => {
  const transporter = emailService.getTransporter({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'sender@example.com',
    smtpPass: 'test-password',
    smtpSecure: false,
  });

  assert.ok(transporter);
  assert.equal(typeof transporter.sendMail, 'function');
});
