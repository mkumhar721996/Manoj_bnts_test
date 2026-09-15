const express = require('express');
const crypto = require('crypto');
const { validate: validateIdentifier } = require('../validation/identifierValidator');
const otpStore = require('../store/otpStore');
const otpService = require('../services/otpService');
const userStore = require('../store/userStore');
const sessionStore = require('../store/sessionStore');
const { parseCookies } = require('../utils/cookies');
const { renderOtpIdentifierPage } = require('../views/pages/otpIdentifierPage');
const { renderOtpCodePage } = require('../views/pages/otpCodePage');
const { renderOtpAccountPage } = require('../views/pages/otpAccountPage');

const router = express.Router();

const INCORRECT_CODE_ERROR = 'That code is incorrect. Please try again.';
const LOCKED_OUT_ERROR = 'Too many incorrect attempts. Please request a new code.';

function verifyOtp(identifier, purpose, code) {
  if (typeof identifier !== 'string') {
    return { status: 'invalid' };
  }
  if (otpStore.isLocked(identifier, purpose)) {
    return { status: 'locked' };
  }

  const record = otpStore.find(identifier, purpose);
  if (!record || record.used || record.expiresAt < Date.now() || record.code !== code) {
    otpStore.recordFailedAttempt(identifier, purpose);
    if (otpStore.isLocked(identifier, purpose)) {
      return { status: 'locked' };
    }
    return { status: 'invalid' };
  }

  return { status: 'valid', record };
}

router.get('/signup', (req, res) => {
  res.type('html').send(renderOtpIdentifierPage({ mode: 'signup' }));
});

router.post('/signup', (req, res) => {
  const result = validateIdentifier(req.body || {});
  if (!result.valid) {
    return res
      .status(400)
      .type('html')
      .send(
        renderOtpIdentifierPage({ mode: 'signup', error: result.error, value: req.body.identifier })
      );
  }

  const code = otpStore.create(result.value, 'signup', result.type);
  otpService.sendOtp(result.type, result.value, code);
  return res.status(200).type('html').send(renderOtpCodePage({ mode: 'signup', identifier: result.value }));
});

router.post('/signup/verify', (req, res) => {
  const { identifier, code } = req.body || {};
  const result = verifyOtp(identifier, 'signup', code);

  if (result.status === 'locked') {
    return res
      .status(429)
      .type('html')
      .send(renderOtpCodePage({ mode: 'signup', identifier, error: LOCKED_OUT_ERROR }));
  }
  if (result.status === 'invalid') {
    return res
      .status(400)
      .type('html')
      .send(renderOtpCodePage({ mode: 'signup', identifier, error: INCORRECT_CODE_ERROR }));
  }

  otpStore.markUsed(identifier, 'signup');
  let user = userStore.findByIdentifier(identifier);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      ...(result.record.type === 'email' ? { email: identifier } : { phone: identifier }),
      verified: true,
    };
    userStore.save(user);
  }

  const sessionToken = sessionStore.create(user.id);
  res.cookie('sessionToken', sessionToken, { httpOnly: true });
  return res.status(201).type('html').send(renderOtpAccountPage({ identifier }));
});

router.get('/login', (req, res) => {
  res.type('html').send(renderOtpIdentifierPage({ mode: 'login' }));
});

router.post('/login', (req, res) => {
  const result = validateIdentifier(req.body || {});
  const user = result.valid ? userStore.findByIdentifier(result.value) : undefined;

  if (!result.valid || !user) {
    return res
      .status(400)
      .type('html')
      .send(
        renderOtpIdentifierPage({
          mode: 'login',
          error: result.valid
            ? 'No account found for that phone number or email address.'
            : result.error,
          value: req.body.identifier,
        })
      );
  }

  const code = otpStore.create(result.value, 'login', result.type);
  otpService.sendOtp(result.type, result.value, code);
  return res.status(200).type('html').send(renderOtpCodePage({ mode: 'login', identifier: result.value }));
});

router.post('/login/verify', (req, res) => {
  const { identifier, code } = req.body || {};
  const result = verifyOtp(identifier, 'login', code);

  if (result.status === 'locked') {
    return res
      .status(429)
      .type('html')
      .send(renderOtpCodePage({ mode: 'login', identifier, error: LOCKED_OUT_ERROR }));
  }
  if (result.status === 'invalid') {
    return res
      .status(400)
      .type('html')
      .send(renderOtpCodePage({ mode: 'login', identifier, error: INCORRECT_CODE_ERROR }));
  }

  otpStore.markUsed(identifier, 'login');
  const user = userStore.findByIdentifier(identifier);
  if (!user) {
    return res
      .status(400)
      .type('html')
      .send(
        renderOtpIdentifierPage({
          mode: 'login',
          error: 'No account found for that phone number or email address.',
        })
      );
  }

  const sessionToken = sessionStore.create(user.id);
  res.cookie('sessionToken', sessionToken, { httpOnly: true });
  return res.status(200).type('html').send(renderOtpAccountPage({ identifier }));
});

router.post('/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.sessionToken) {
    sessionStore.expire(cookies.sessionToken);
  }
  res.clearCookie('sessionToken');
  return res.redirect('/');
});

module.exports = router;
