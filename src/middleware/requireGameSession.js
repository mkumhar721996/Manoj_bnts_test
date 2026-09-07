const sessionStore = require('../store/sessionStore');
const { parseCookies } = require('../utils/cookies');

function requireGameSession(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.sessionToken;

  if (!sessionToken || !sessionStore.isActive(sessionToken)) {
    const { reason, userId } = sessionStore.describeRejection(sessionToken);
    console.info('requireGameSession: rejecting request', {
      tokenPresent: Boolean(sessionToken),
      reason,
      userId,
    });
    return res.redirect('/');
  }

  sessionStore.touch(sessionToken);
  next();
}

module.exports = requireGameSession;
