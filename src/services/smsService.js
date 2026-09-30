let outbox = [];

function reset() {
  outbox = [];
}

function sendOtpSms(phone, code) {
  outbox.push({ to: phone, code });
}

function getLastSmsTo(phone) {
  for (let i = outbox.length - 1; i >= 0; i -= 1) {
    if (outbox[i].to === phone) {
      return outbox[i];
    }
  }
  return undefined;
}

module.exports = { sendOtpSms, getLastSmsTo, reset };
