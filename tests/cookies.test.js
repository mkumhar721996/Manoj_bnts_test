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

  it('logs a warning with the cookie name and error when decoding fails', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    parseCookies('sessionToken=%; other=xyz');

    expect(warnSpy).toHaveBeenCalledWith(
      'parseCookies: failed to decode cookie value',
      expect.objectContaining({ name: 'sessionToken', value: '%', error: expect.any(String) })
    );

    warnSpy.mockRestore();
  });
});
