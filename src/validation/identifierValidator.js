const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

function validate(payload) {
  const raw = typeof payload.identifier === 'string' ? payload.identifier.trim() : '';

  if (!raw) {
    return { valid: false, error: 'Enter your phone number or email address.' };
  }
  if (EMAIL_REGEX.test(raw)) {
    return { valid: true, type: 'email', value: raw.toLowerCase() };
  }
  const digitsOnly = raw.replace(/[\s-]/g, '');
  if (PHONE_REGEX.test(digitsOnly)) {
    return { valid: true, type: 'phone', value: digitsOnly };
  }
  return { valid: false, error: 'Enter a valid phone number or email address.' };
}

module.exports = { validate };
