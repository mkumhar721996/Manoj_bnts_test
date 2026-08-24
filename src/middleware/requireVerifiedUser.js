const userStore = require('../store/userStore');

function requireVerifiedUser(req, res, next) {
  const userId = req.headers['x-user-id'];

  if (typeof userId !== 'string' || userId.trim() === '') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = userStore.findById(userId);

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!user.verified) {
    return res
      .status(403)
      .json({ error: 'Please verify your email address before accessing this resource' });
  }

  req.user = user;
  next();
}

module.exports = requireVerifiedUser;
