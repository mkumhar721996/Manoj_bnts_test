const { HOME_PAGE_STYLE } = require('../src/views/pages/homePageStyle');

describe('AC7: mobile viewport keeps the pizza grid and header usable without horizontal scrolling', () => {
  it('collapses the pizza grid to a single column and wraps the header nav under a mobile breakpoint', () => {
    const mediaQueryMatch = HOME_PAGE_STYLE.match(
      /@media \(max-width: 640px\) \{([\s\S]*?)\n\}\n/
    );
    expect(mediaQueryMatch).not.toBeNull();

    const mobileBlock = mediaQueryMatch[1];
    expect(mobileBlock).toMatch(/\.pizza-card-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
    expect(HOME_PAGE_STYLE).toMatch(/\.nav-bar\s*\{[^}]*flex-wrap:\s*wrap/);
  });
});
