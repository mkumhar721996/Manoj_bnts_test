const express = require('express');
const userStore = require('../store/userStore');
const { verifyPassword } = require('../utils/password');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = email && userStore.findByEmail(email);

  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.verified) {
    return res.status(403).json({
      error: 'Please verify your email address. Check your inbox for the verification link.',
    });
  }

  return res.status(200).json({ message: 'Login successful' });
});

module.exports = router;
