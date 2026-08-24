const REQUIRED_FIELDS = ['name', 'email', 'password', 'dateOfBirth'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(payload) {
  for (const field of REQUIRED_FIELDS) {
    if (!payload[field] || `${payload[field]}`.trim() === '') {
      return { valid: false, field, message: `${field} is required` };
    }
  }

  if (!EMAIL_REGEX.test(payload.email)) {
    return { valid: false, field: 'email', message: 'Invalid email format' };
  }

  const meetsPasswordRequirements =
    payload.password.length >= 8 &&
    /[a-zA-Z]/.test(payload.password) &&
    /\d/.test(payload.password);

  if (!meetsPasswordRequirements) {
    return {
      valid: false,
      field: 'password',
      message:
        'Password must be at least 8 characters long and contain at least one letter and one digit',
    };
  }

  return { valid: true };
}

module.exports = { validate };
