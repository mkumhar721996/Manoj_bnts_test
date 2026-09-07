const sessionStore = require('../store/sessionStore');
const { parseCookies } = require('../utils/cookies');

function requireGameSession(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.sessionToken;

  if (!sessionToken || !sessionStore.isActive(sessionToken)) {
    console.warn('[game] Rejected request with missing or inactive session', {
      hasSessionToken: !!sessionToken,
    });
    return res.redirect('/');
  }

  sessionStore.touch(sessionToken);
  next();
}

module.exports = requireGameSession;
