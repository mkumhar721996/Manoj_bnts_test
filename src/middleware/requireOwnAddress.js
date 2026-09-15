const addressStore = require('../store/addressStore');

function requireOwnAddress(req, res, next) {
  const address = addressStore.findById(req.params.id);

  if (!address || address.userId !== req.user.id) {
    console.info(
      `[addresses] not found or not owned: id=${req.params.id} method=${req.method} path=${req.originalUrl}`
    );
    return res.status(404).end();
  }

  req.address = address;
  next();
}

module.exports = requireOwnAddress;
