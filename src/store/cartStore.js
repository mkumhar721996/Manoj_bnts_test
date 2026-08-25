const { PROMO_CODES } = require('../data/promoCodes');

const DEFAULT_CART = () => ({
  subtotal: 54.0,
  deliveryFee: 0,
  ovenSurcharge: 1.5,
  salesTax: 4.72,
  promoCode: null,
});

let cart = DEFAULT_CART();

function reset(overrides = {}) {
  cart = { ...DEFAULT_CART(), ...overrides };
}

function getCart() {
  return cart;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function getSummary() {
  const discount = cart.promoCode
    ? round2((cart.subtotal * cart.promoCode.discountPercent) / 100)
    : 0;
  const total = round2(
    cart.subtotal - discount + cart.deliveryFee + cart.ovenSurcharge + cart.salesTax
  );

  return {
    subtotal: cart.subtotal,
    deliveryFee: cart.deliveryFee,
    ovenSurcharge: cart.ovenSurcharge,
    salesTax: cart.salesTax,
    promoCode: cart.promoCode,
    discount,
    total,
  };
}

function applyPromoCode(rawCode) {
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';

  if (!code) {
    return { ok: false, reason: 'blank' };
  }

  const match = PROMO_CODES[code];
  if (!match) {
    return { ok: false, reason: 'invalid' };
  }

  cart.promoCode = { code, discountPercent: match.discountPercent };
  return { ok: true };
}

function removePromoCode() {
  cart.promoCode = null;
}

module.exports = { reset, getCart, getSummary, applyPromoCode, removePromoCode };
