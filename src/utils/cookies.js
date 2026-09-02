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
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}

module.exports = { parseCookies };
