const express = require('express');
const { renderHomePage } = require('../views/marketingSite/pages/homePage');
const { renderLegalStubPage } = require('../views/marketingSite/pages/legalStubPage');

const router = express.Router();

router.get('/pizzeria', (req, res) => {
  res.type('html').send(renderHomePage());
});

router.get('/pizzeria/privacy-policy', (req, res) => {
  res.type('html').send(renderLegalStubPage('Privacy Policy'));
});

router.get('/pizzeria/delivery-terms', (req, res) => {
  res.type('html').send(renderLegalStubPage('Delivery Terms'));
});

module.exports = router;
