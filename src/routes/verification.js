const express = require('express');
const userStore = require('../store/userStore');
const verificationTokenStore = require('../store/verificationTokenStore');
const emailService = require('../services/emailService');

const router = express.Router();

router.get('/verify-email', (req, res) => {
  const { token } = req.query;

  if (typeof token !== 'string' || token.trim() === '') {
    return res.status(400).json({ error: 'A verification token is required' });
  }

  const record = verificationTokenStore.findByToken(token);

  if (!record) {
    return res.status(400).json({ error: 'Invalid verification link' });
  }

  const user = userStore.findByEmail(record.email);

  if (!user) {
    return res.status(400).json({ error: 'Invalid verification link' });
  }

  if (record.used) {
    return res.status(410).json({
      error: 'This verification link has already been used. Please log in or request a new link.',
    });
  }

  if (record.expiresAt < Date.now()) {
    return res.status(410).json({
      error: 'This verification link has expired. Please resend the verification email.',
    });
  }

  user.verified = true;
  verificationTokenStore.markUsed(token);

  return res.status(200).json({ message: 'Your email has been verified' });
});

router.post('/resend-verification', (req, res) => {
  const { email } = req.body || {};

  if (typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = userStore.findByEmail(email);

  if (!user) {
    return res.status(404).json({ error: 'No account found for that email' });
  }

  if (user.verified) {
    return res.status(400).json({ error: 'This account has already been verified' });
  }

  const token = verificationTokenStore.create(user.email);
  emailService.sendVerificationEmail(user.email, token);

  return res.status(200).json({ message: 'Verification email resent' });
});

module.exports = router;
