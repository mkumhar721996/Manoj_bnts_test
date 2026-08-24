const express = require('express');
const crypto = require('crypto');
const { validate } = require('../validation/registrationValidator');
const userStore = require('../store/userStore');
const mailer = require('../services/mailer');
const { hashPassword } = require('../utils/password');

const router = express.Router();

router.post('/register', (req, res) => {
  const payload = req.body || {};
  const result = validate(payload);

  if (!result.valid) {
    return res.status(400).json({ error: result.message });
  }

  const existing = userStore.findByEmail(payload.email);
  if (existing) {
    if (existing.verified) {
      return res.status(409).json({
        error: 'This email is already registered. Please log in or reset your password.',
      });
    }

    const resendToken = crypto.randomUUID();
    existing.verificationToken = resendToken;
    userStore.save(existing);
    mailer.sendVerificationEmail(existing.email, resendToken);

    return res.status(200).json({
      message: 'This email is already registered but not yet verified. Please check your inbox to verify your email.',
    });
  }

  const verificationToken = crypto.randomUUID();
  const user = {
    id: crypto.randomUUID(),
    name: payload.name,
    email: payload.email,
    dateOfBirth: payload.dateOfBirth,
    passwordHash: hashPassword(payload.password),
    verified: false,
    verificationToken,
  };
  userStore.save(user);
  mailer.sendVerificationEmail(user.email, verificationToken);

  const { passwordHash, verificationToken: _token, ...safeUser } = user;
  return res.status(201).json({
    message: 'Registration successful. Please check your inbox to verify your email.',
    user: safeUser,
  });
});

module.exports = router;
