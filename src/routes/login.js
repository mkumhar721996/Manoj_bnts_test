const express = require('express');
const userStore = require('../store/userStore');
const sessionStore = require('../store/sessionStore');
const { hashPassword, verifyPassword } = require('../utils/password');

const router = express.Router();

// Fixed-cost stand-in for a real password hash, used to keep the scrypt
// comparison's timing identical whether or not the email is registered.
const DUMMY_HASH = hashPassword('not-a-real-password');

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = userStore.findByEmail(email);
  const passwordMatches = verifyPassword(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.verified) {
    return res.status(403).json({
      error: 'Please verify your email address. Check your inbox for the verification link.',
    });
  }

  const sessionToken = sessionStore.create(user.id);

  return res.status(200).json({ message: 'Login successful', sessionToken });
});

module.exports = router;
