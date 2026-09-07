const authenticateRequest = require('./authenticateRequest');

function requireVerifiedUser(req, res, next) {
  const user = authenticateRequest(req, res);

  if (!user) {
    return undefined;
  }

  if (!user.verified) {
    return res
      .status(403)
      .json({ error: 'Please verify your email address before accessing this resource' });
  }

  req.user = user;
  next();
}

module.exports = requireVerifiedUser;
