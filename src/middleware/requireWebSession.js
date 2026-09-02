const userStore = require('../store/userStore');
const sessionStore = require('../store/sessionStore');
const { parseCookies } = require('../utils/cookies');

const SESSION_COOKIE_NAME = 'web_session';

function requireWebSession(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies[SESSION_COOKIE_NAME];
  const userId = sessionToken ? sessionStore.findUserId(sessionToken) : undefined;
  const user = userId ? userStore.findById(userId) : undefined;

  if (!user) {
    return res.redirect('/');
  }

  req.user = user;
  next();
}

module.exports = { requireWebSession, SESSION_COOKIE_NAME };
