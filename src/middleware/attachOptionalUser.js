const userStore = require('../store/userStore');
const sessionStore = require('../store/sessionStore');
const { parseCookies } = require('../utils/cookies');

function attachOptionalUser(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const userId = cookies.sessionToken ? sessionStore.findUserId(cookies.sessionToken) : undefined;
  req.user = userId ? userStore.findById(userId) : undefined;
  next();
}

module.exports = attachOptionalUser;
