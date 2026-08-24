let sentEmails = [];

function reset() {
  sentEmails = [];
}

function sendVerificationEmail(email, token) {
  sentEmails.push({ to: email, token, sentAt: new Date() });
}

function getSentEmails() {
  return sentEmails;
}

module.exports = { sendVerificationEmail, getSentEmails, reset };
