const userStore = require('../store/userStore');
const sessionStore = require('../store/sessionStore');

const BEARER_PREFIX = 'Bearer ';

function authenticateRequest(req, res) {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith(BEARER_PREFIX)) {
    console.warn('[auth] Missing or invalid Authorization header');
    res.status(401).json({ error: 'Authentication required' });
    return undefined;
  }

  const sessionToken = authHeader.slice(BEARER_PREFIX.length);
  const userId = sessionStore.findUserId(sessionToken);

  if (!userId) {
    console.warn('[auth] Session token not found or invalid');
    res.status(401).json({ error: 'Authentication required' });
    return undefined;
  }

  const user = userStore.findById(userId);

  if (!user) {
    console.warn('[auth] User lookup failed for session token', { userId });
    res.status(401).json({ error: 'Authentication required' });
    return undefined;
  }

  return user;
}

module.exports = authenticateRequest;
