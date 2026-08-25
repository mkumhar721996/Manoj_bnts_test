const { renderLayout } = require('../layout');
const { escapeHtml } = require('../../utils/escapeHtml');

function renderFeedPage(user) {
  const firstName = user.name.split(' ')[0];
  const initial = user.name.charAt(0).toUpperCase();
  const safeFirstName = escapeHtml(firstName);
  const safeInitial = escapeHtml(initial);
  const body = `
<div class="app-shell">
  <nav class="side-nav">
    <div class="side-nav__item is-current">Feed</div>
    <div class="side-nav__item">Friends</div>
    <div class="side-nav__item">Groups</div>
    <div class="side-nav__item">Marketplace</div>
    <div class="side-nav__item">Watch</div>
  </nav>

  <main>
    <div class="welcome-banner">
      <div class="avatar" id="feedAvatarInitial">${safeInitial}</div>
      <h1 id="feedWelcomeName">Welcome back, ${safeFirstName}!</h1>
      <p>You're logged in. Here's what's new in your feed.</p>
    </div>
    <div class="card">
      <div class="post">
        <div class="avatar">A</div>
        <div>
          <div class="post-author">Aisha Khan</div>
          <div class="post-meta">2 hours ago</div>
          <p>Just finished a 10k run along the river trail — beautiful morning for it!</p>
        </div>
      </div>
      <div class="post">
        <div class="avatar">D</div>
        <div>
          <div class="post-author">Diego Fernandez</div>
          <div class="post-meta">5 hours ago</div>
          <p>Posted 6 new photos from the team offsite in Austin.</p>
        </div>
      </div>
      <div class="post">
        <div class="avatar">L</div>
        <div>
          <div class="post-author">Lin Wei</div>
          <div class="post-meta">Yesterday</div>
          <p>Excited to share that I started a new role this week!</p>
        </div>
      </div>
    </div>
  </main>

  <aside class="right-rail">
    <h3>Contacts</h3>
    <div class="contact"><div class="avatar">A</div> Aisha Khan</div>
    <div class="contact"><div class="avatar">D</div> Diego Fernandez</div>
    <div class="contact"><div class="avatar">L</div> Lin Wei</div>
    <div class="contact"><div class="avatar">S</div> Sam Okafor</div>
  </aside>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderFeedPage };
