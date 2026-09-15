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

function isInvalidOtp(record, code) {
  return !record || record.used || record.expiresAt < Date.now() || record.code !== code;
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
  const record = typeof identifier === 'string' ? otpStore.find(identifier, 'signup') : undefined;

  if (isInvalidOtp(record, code)) {
    return res
      .status(400)
      .type('html')
      .send(
        renderOtpCodePage({
          mode: 'signup',
          identifier,
          error: 'That code is incorrect. Please try again.',
        })
      );
  }

  otpStore.markUsed(identifier, 'signup');
  let user = userStore.findByIdentifier(identifier);
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      ...(record.type === 'email' ? { email: identifier } : { phone: identifier }),
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
  const record = typeof identifier === 'string' ? otpStore.find(identifier, 'login') : undefined;

  if (isInvalidOtp(record, code)) {
    return res
      .status(400)
      .type('html')
      .send(
        renderOtpCodePage({
          mode: 'login',
          identifier,
          error: 'That code is incorrect. Please try again.',
        })
      );
  }

  otpStore.markUsed(identifier, 'login');
  const user = userStore.findByIdentifier(identifier);
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
