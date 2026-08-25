const express = require('express');
const { renderFornoRossoHomePage } = require('../views/pages/fornoRossoHomePage');

const router = express.Router();

router.get('/forno-rosso', (req, res) => {
  res.type('html').send(renderFornoRossoHomePage());
});

module.exports = router;
