function parseCookies(header) {
  const cookies = {};

  if (typeof header !== 'string' || header.length === 0) {
    return cookies;
  }

  for (const pair of header.split(';')) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  }

  return cookies;
}

module.exports = { parseCookies };
