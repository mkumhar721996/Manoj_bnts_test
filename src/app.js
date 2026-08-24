const express = require('express');
const registrationRouter = require('./routes/registration');

const app = express();
app.use(express.json());
app.use('/api', registrationRouter);

module.exports = app;
