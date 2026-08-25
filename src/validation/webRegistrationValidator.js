const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(payload) {
  const errors = [];
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!name) {
    errors.push('Name is required.');
  }

  if (!email) {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Email address is not valid.');
  }

  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }

  return { errors, name, email, password };
}

module.exports = { validate };
