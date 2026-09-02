const { renderLayout } = require('../layout');

function renderGamePage() {
  const body = `
<div class="status-screen">
  <div class="card" id="slot-machine">
    <h2>Slot Machine</h2>
    <p>Good luck!</p>
  </div>
</div>
`;

  return renderLayout('Facebook', body);
}

module.exports = { renderGamePage };
