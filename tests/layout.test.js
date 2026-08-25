const { renderLayout } = require('../src/views/layout');

describe('renderLayout: supports a per-page style override', () => {
  it('uses the shared default style block when no style override is given', () => {
    const html = renderLayout('Facebook', '<p>hi</p>');

    expect(html).toContain('<title>Facebook</title>');
    expect(html).toContain('<p>hi</p>');
    expect(html).toContain('--brand: #1877f2;');
  });

  it('uses the provided style block instead of the default when one is given', () => {
    const customStyle = ':root { --brand: #C82D25; }';

    const html = renderLayout('Forno Rosso', '<p>pizza</p>', customStyle);

    expect(html).toContain('<title>Forno Rosso</title>');
    expect(html).toContain('<p>pizza</p>');
    expect(html).toContain(customStyle);
    expect(html).not.toContain('--brand: #1877f2;');
  });
});
