const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

function validate(payload) {
  const errors = [];
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';

  if (!name) {
    errors.push('Name is required.');
  }

  if (!phone) {
    errors.push('Phone number is required.');
  } else if (!PHONE_REGEX.test(phone)) {
    errors.push('Phone number is not valid.');
  }

  if (!email) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Email address is not valid.');
  }

  return { errors, name, phone, email };
}

module.exports = { validate };
