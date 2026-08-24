let outbox = [];

function reset() {
  outbox = [];
}

function sendVerificationEmail(email, token) {
  outbox.push({ to: email.toLowerCase(), token });
}

function getLastEmailTo(email) {
  const target = email.toLowerCase();
  for (let i = outbox.length - 1; i >= 0; i -= 1) {
    if (outbox[i].to === target) {
      return outbox[i];
    }
  }
  return undefined;
}

module.exports = { sendVerificationEmail, getLastEmailTo, reset };
