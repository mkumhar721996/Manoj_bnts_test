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
      try {
        cookies[key] = decodeURIComponent(value);
      } catch {
        // Malformed percent-encoding: skip this cookie rather than 500.
      }
    }
  }

  return cookies;
}

module.exports = { parseCookies };
