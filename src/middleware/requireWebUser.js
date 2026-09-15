const userStore = require('../store/userStore');
const sessionStore = require('../store/sessionStore');
const { parseCookies } = require('../utils/cookies');

function requireWebUser(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.sessionToken;

  if (!sessionToken || !sessionStore.isActive(sessionToken)) {
    return res.redirect('/');
  }

  const userId = sessionStore.findUserId(sessionToken);
  const user = userId ? userStore.findById(userId) : undefined;

  if (!user) {
    return res.redirect('/');
  }

  sessionStore.touch(sessionToken);
  req.user = user;
  next();
}

module.exports = requireWebUser;
