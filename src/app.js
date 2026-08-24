const express = require('express');
const registrationRouter = require('./routes/registration');
const verificationRouter = require('./routes/verification');
const loginRouter = require('./routes/login');

const app = express();
app.use(express.json());
app.use('/api', registrationRouter);
app.use('/api', verificationRouter);
app.use('/api', loginRouter);

module.exports = app;
