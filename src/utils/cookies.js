function parseCookies(header) {
  if (typeof header !== 'string' || header.length === 0) {
    return {};
  }

  return header.split(';').reduce((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) {
      return cookies;
    }

    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();

    try {
      cookies[name] = decodeURIComponent(value);
    } catch (err) {
      // Malformed percent-encoding (e.g. a lone "%"): skip this cookie
      // rather than letting decodeURIComponent's URIError crash the request.
    }

    return cookies;
  }, {});
}

module.exports = { parseCookies };
