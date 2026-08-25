const path = require('path');
const express = require('express');
const registrationRouter = require('./routes/registration');
const accountRouter = require('./routes/account');
const verificationRouter = require('./routes/verification');
const loginRouter = require('./routes/login');
const webRouter = require('./routes/web');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', registrationRouter);
app.use('/api', accountRouter);
app.use('/api', verificationRouter);
app.use('/api', loginRouter);
app.use('/', webRouter);

module.exports = app;
