function validate(password) {
  const meetsPasswordRequirements =
    typeof password === 'string' &&
    password.length >= 8 &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password);

  if (!meetsPasswordRequirements) {
    return {
      valid: false,
      message:
        'Password must be at least 8 characters long and contain at least one letter and one digit.',
    };
  }

  return { valid: true };
}

module.exports = { validate };
