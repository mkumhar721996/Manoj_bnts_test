const express = require('express');
const requireVerifiedUser = require('../middleware/requireVerifiedUser');

const router = express.Router();

router.get('/account', requireVerifiedUser, (req, res) => {
  const { id, name, email, verified } = req.user;
  return res.status(200).json({ id, name, email, verified });
});

module.exports = router;
