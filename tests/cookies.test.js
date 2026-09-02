const { parseCookies } = require('../src/utils/cookies');

describe('parseCookies', () => {
  it('parses well-formed cookie headers', () => {
    expect(parseCookies('sessionToken=abc123; other=xyz')).toEqual({
      sessionToken: 'abc123',
      other: 'xyz',
    });
  });

  it('ignores a cookie whose value is malformed percent-encoding instead of throwing', () => {
    expect(() => parseCookies('sessionToken=%; other=xyz')).not.toThrow();
    expect(parseCookies('sessionToken=%; other=xyz')).toEqual({ other: 'xyz' });
  });
});
