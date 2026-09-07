const userStore = require('../store/userStore');
const sessionStore = require('../store/sessionStore');

const BEARER_PREFIX = 'Bearer ';

function authenticateRequest(req, res) {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ error: 'Authentication required' });
    return undefined;
  }

  const sessionToken = authHeader.slice(BEARER_PREFIX.length);
  const userId = sessionStore.findUserId(sessionToken);

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return undefined;
  }

  const user = userStore.findById(userId);

  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return undefined;
  }

  return user;
}

module.exports = authenticateRequest;
