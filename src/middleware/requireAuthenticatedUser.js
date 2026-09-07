const userStore = require('../store/userStore');
const sessionStore = require('../store/sessionStore');

const BEARER_PREFIX = 'Bearer ';

function requireAuthenticatedUser(req, res, next) {
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

  req.user = user;
  next();
}

module.exports = requireAuthenticatedUser;
