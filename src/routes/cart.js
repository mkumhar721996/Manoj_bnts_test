const express = require('express');
const cartStore = require('../store/cartStore');
const { computeSummary } = require('../services/cartPricing');
const { renderCartPage } = require('../views/pages/cartPage');

const router = express.Router();

function sendCartPage(res) {
  const items = cartStore.getItems();
  const summary = computeSummary(items);
  res.type('html').send(renderCartPage(items, summary));
}

router.get('/cart', (req, res) => {
  sendCartPage(res);
});

router.post('/cart/items/:itemId/increment', (req, res) => {
  cartStore.incrementQuantity(req.params.itemId);
  sendCartPage(res);
});

router.post('/cart/items/:itemId/decrement', (req, res) => {
  cartStore.decrementQuantity(req.params.itemId);
  sendCartPage(res);
});

router.post('/cart/items/:itemId/remove', (req, res) => {
  cartStore.removeItem(req.params.itemId);
  sendCartPage(res);
});

module.exports = router;
