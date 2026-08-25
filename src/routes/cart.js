const express = require('express');
const { renderCartPage } = require('../views/pages/cartPage');
const cartStore = require('../store/cartStore');

const router = express.Router();

const ERROR_MESSAGES = {
  blank: 'Please enter a promo code.',
  invalid: 'That promo code is not valid.',
};

router.get('/cart', (req, res) => {
  res.type('html').send(renderCartPage(cartStore.getSummary()));
});

router.post('/cart/promo/apply', (req, res) => {
  const { promoCode } = req.body || {};
  const result = cartStore.applyPromoCode(promoCode);

  if (!result.ok) {
    const typedCode = typeof promoCode === 'string' ? promoCode : '';
    return res
      .status(200)
      .type('html')
      .send(
        renderCartPage(cartStore.getSummary(), {
          promoError: ERROR_MESSAGES[result.reason],
          typedCode,
        })
      );
  }

  return res.status(200).type('html').send(renderCartPage(cartStore.getSummary()));
});

router.post('/cart/promo/remove', (req, res) => {
  cartStore.removePromoCode();
  res.status(200).type('html').send(renderCartPage(cartStore.getSummary()));
});

module.exports = router;
