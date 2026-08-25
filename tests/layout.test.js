const { renderLayout } = require('../src/views/layout');

describe('renderLayout', () => {
  it('uses the default Facebook-clone stylesheet when no override is given', () => {
    const html = renderLayout('Facebook', '<p>hi</p>');

    expect(html).toContain('--brand: #1877f2');
    expect(html).toContain('<p>hi</p>');
  });

  it('renders a caller-supplied style and extra head markup instead of the default', () => {
    const html = renderLayout('Custom', '<p>hi</p>', {
      style: '.custom { color: red; }',
      extraHead: '<link rel="stylesheet" href="https://fonts.example.com/font.css">',
    });

    expect(html).toContain('.custom { color: red; }');
    expect(html).toContain('<link rel="stylesheet" href="https://fonts.example.com/font.css">');
    expect(html).not.toContain('--brand: #1877f2');
  });
});
