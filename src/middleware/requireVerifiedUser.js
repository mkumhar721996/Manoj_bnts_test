const userStore = require('../store/userStore');
const sessionStore = require('../store/sessionStore');

const BEARER_PREFIX = 'Bearer ';

function requireVerifiedUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith(BEARER_PREFIX)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const sessionToken = authHeader.slice(BEARER_PREFIX.length);
  const userId = sessionStore.findUserId(sessionToken);

  if (!userId) {
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
