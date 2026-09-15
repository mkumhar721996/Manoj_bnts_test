const emailService = require('./emailService');
const smsService = require('./smsService');

function sendOtp(type, identifier, code) {
  if (type === 'email') {
    emailService.sendOtpEmail(identifier, code);
  } else {
    smsService.sendOtpSms(identifier, code);
  }
}

module.exports = { sendOtp };
