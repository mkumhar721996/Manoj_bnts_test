const express = require('express');
const userStore = require('../store/userStore');

const router = express.Router();

router.get('/verify/:token', (req, res) => {
  const user = userStore.findByVerificationToken(req.params.token);

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired verification token' });
  }

  user.verified = true;
  user.verificationToken = null;
  userStore.save(user);

  return res.status(200).json({ message: 'Your email has been verified. You may now log in.' });
});

module.exports = router;
