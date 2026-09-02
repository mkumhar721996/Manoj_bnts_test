const { renderLayout } = require('../layout');

function renderGamePage() {
  const body = `
<div class="status-screen">
  <div class="card" id="slot-machine-page">
    <h2>Slot Machine</h2>
    <p>Pull the lever to spin the reels. Good luck!</p>
  </div>
</div>
`;

  return renderLayout('Slot Machine', body);
}

module.exports = { renderGamePage };
