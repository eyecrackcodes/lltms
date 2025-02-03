require('dotenv').config();
const emailService = require('./emailService');

async function testEmails() {
  try {
    // Test welcome email
    const welcomeResult = await emailService.sendWelcomeEmail(
      'test@example.com',
      'John Doe'
    );
    console.log('Welcome email result:', welcomeResult);

    // Test password reset
    const resetResult = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'test-reset-token-123'
    );
    console.log('Password reset email result:', resetResult);

    // Test call grading notification
    const gradingResult = await emailService.sendCallGradingNotification(
      'test@example.com',
      'John Doe',
      85,
      '<p>Great job on building rapport!</p><p>Areas for improvement: Script adherence</p>'
    );
    console.log('Call grading notification result:', gradingResult);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEmails();