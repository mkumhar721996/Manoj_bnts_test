const express = require('express');
const crypto = require('crypto');
const { renderHomePage } = require('../views/pages/homePage');
const { renderRegistrationSuccessPage } = require('../views/pages/registrationSuccessPage');
const { renderRegistrationErrorPage } = require('../views/pages/registrationErrorPage');
const { renderFeedPage } = require('../views/pages/feedPage');
const { renderLoginErrorPage } = require('../views/pages/loginErrorPage');
const { validate } = require('../validation/webRegistrationValidator');
const userStore = require('../store/userStore');
const { hashPassword, verifyPassword } = require('../utils/password');

const router = express.Router();

// Fixed-cost stand-in for a real password hash, used to keep the scrypt
// comparison's timing identical whether or not the email is registered.
const DUMMY_HASH = hashPassword('not-a-real-password');

router.get('/', (req, res) => {
  res.type('html').send(renderHomePage());
});

router.post('/register', (req, res) => {
  const payload = req.body || {};
  const { errors, name, email, password } = validate(payload);

  if (errors.length === 0 && userStore.findByEmail(email)) {
    errors.push('This email is already registered.');
  }

  if (errors.length > 0) {
    return res.status(400).type('html').send(renderRegistrationErrorPage(errors, name, email));
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password),
    verified: true,
  };
  userStore.save(user);

  return res.status(201).type('html').send(renderRegistrationSuccessPage(name, email));
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  const user =
    typeof email === 'string' ? userStore.findByEmail(email) : undefined;
  const passwordMatches = verifyPassword(
    typeof password === 'string' ? password : '',
    user ? user.passwordHash : DUMMY_HASH
  );

  if (!user || !passwordMatches) {
    return res.status(401).type('html').send(renderLoginErrorPage());
  }

  return res.status(200).type('html').send(renderFeedPage(user));
});

module.exports = router;
