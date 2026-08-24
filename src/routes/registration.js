const express = require('express');
const crypto = require('crypto');
const { validate } = require('../validation/registrationValidator');
const userStore = require('../store/userStore');

const router = express.Router();

router.post('/register', (req, res) => {
  const payload = req.body || {};
  const result = validate(payload);

  if (!result.valid) {
    return res.status(400).json({ error: result.message });
  }

  if (userStore.findByEmail(payload.email)) {
    return res.status(409).json({ error: 'Email is already in use' });
  }

  const user = {
    id: crypto.randomUUID(),
    name: payload.name,
    email: payload.email,
    dateOfBirth: payload.dateOfBirth,
  };
  userStore.save(user);

  return res.status(201).json({ message: 'Registration successful', user });
});

module.exports = router;
