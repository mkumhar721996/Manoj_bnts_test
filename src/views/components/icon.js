const ICON_PATHS = {
  'shopping-cart':
    '<path d="M3 3h2l2.4 12.4a1 1 0 0 0 1 .8h8.4a1 1 0 0 0 1-.8L20 8H6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1" fill="currentColor"/><circle cx="17" cy="20" r="1" fill="currentColor"/>',
  'fire-extinguisher':
    '<path d="M9 2h4M11 2v3M7 7h8l-1 3H8L7 7zM9 10v10a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V10M15 9l4-2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  'arrow-right':
    '<path d="M4 12h16M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  truck:
    '<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><circle cx="6" cy="18" r="1.6" fill="currentColor"/><circle cx="17" cy="18" r="1.6" fill="currentColor"/>',
  plus:
    '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
  star:
    '<path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8-5.1-4.7 6.9-.8L12 2z" fill="currentColor"/>',
  shield:
    '<path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  compass:
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M15 9l-2 6-4-2 2-6 4 2z" fill="currentColor"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
  facebook:
    '<path d="M14 9h2V6h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2l1-3h-3V9c0-.3.2-.5.5-.5H14z" fill="currentColor"/>',
  twitter:
    '<path d="M21 5.5c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.3 1.7-2.2-.7.4-1.6.8-2.4 1a3.7 3.7 0 0 0-6.4 3.4A10.6 10.6 0 0 1 4 4.6a3.7 3.7 0 0 0 1.2 5 3.6 3.6 0 0 1-1.7-.5v.1c0 1.8 1.3 3.3 3 3.6a3.7 3.7 0 0 1-1.7.1 3.7 3.7 0 0 0 3.5 2.6A7.4 7.4 0 0 1 3 17a10.5 10.5 0 0 0 5.7 1.7c6.8 0 10.6-5.7 10.6-10.6v-.5c.7-.5 1.4-1.2 1.7-2.1z" fill="currentColor"/>',
};

function renderIcon(name, attrs = '') {
  const path = ICON_PATHS[name];
  if (!path) {
    throw new Error(`Unknown icon: ${name}`);
  }
  return `<svg data-icon="${name}" width="20" height="20" viewBox="0 0 24 24" ${attrs}>${path}</svg>`;
}

module.exports = { renderIcon };
