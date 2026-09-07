const sessionStore = require('../store/sessionStore');
const { parseCookies } = require('../utils/cookies');

function requireSession(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.sessionToken;

  if (!sessionToken || !sessionStore.isActive(sessionToken)) {
    return res.redirect('/');
  }

  req.userId = sessionStore.findUserId(sessionToken);
  next();
}

module.exports = requireSession;
