const authenticateRequest = require('./authenticateRequest');

function requireAuthenticatedUser(req, res, next) {
  const user = authenticateRequest(req, res);

  if (!user) {
    return undefined;
  }

  req.user = user;
  next();
}

module.exports = requireAuthenticatedUser;
