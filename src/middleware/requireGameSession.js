const sessionStore = require('../store/sessionStore');
const { parseCookies } = require('../utils/cookies');

function requireGameSession(req, res, next) {
  res.set('Cache-Control', 'no-store');
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.sessionToken;

  if (!sessionToken || !sessionStore.isActive(sessionToken)) {
    return res.redirect('/');
  }

  sessionStore.touch(sessionToken);
  next();
}

module.exports = requireGameSession;
