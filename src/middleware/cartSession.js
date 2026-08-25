const crypto = require('crypto');

const COOKIE_NAME = 'cart_id';

function parseCookies(header) {
  const cookies = {};
  if (!header) {
    return cookies;
  }

  header.split(';').forEach((pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }
    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  });

  return cookies;
}

function cartSession(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  let cartId = cookies[COOKIE_NAME];

  if (!cartId) {
    cartId = crypto.randomUUID();
    res.cookie(COOKIE_NAME, cartId, { httpOnly: true, sameSite: 'lax' });
  }

  req.cartId = cartId;
  next();
}

module.exports = cartSession;
