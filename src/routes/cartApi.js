const express = require('express');
const cartStore = require('../store/cartStore');

const router = express.Router();

router.get('/cart', (req, res) => {
  res.json({ count: cartStore.getCount() });
});

router.post('/cart/items', (req, res) => {
  const quantity = Number(req.body && req.body.quantity);
  const count = cartStore.addItem(Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
  res.json({ count });
});

module.exports = router;
