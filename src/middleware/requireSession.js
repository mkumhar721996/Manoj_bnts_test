const sessionStore = require('../store/sessionStore');
const userStore = require('../store/userStore');
const { parseCookies } = require('../utils/cookies');

function requireSession(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.sessionToken;

  if (!sessionToken || !sessionStore.isValid(sessionToken)) {
    return res.redirect(`/login?redirectTo=${encodeURIComponent(req.originalUrl)}`);
  }

  req.user = userStore.findById(sessionStore.findUserId(sessionToken));
  next();
}

module.exports = requireSession;
