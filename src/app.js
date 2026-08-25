const express = require('express');
const registrationRouter = require('./routes/registration');
const accountRouter = require('./routes/account');
const verificationRouter = require('./routes/verification');
const loginRouter = require('./routes/login');
const webRouter = require('./routes/web');
const fornoRossoRouter = require('./routes/fornoRosso');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api', registrationRouter);
app.use('/api', accountRouter);
app.use('/api', verificationRouter);
app.use('/api', loginRouter);
app.use('/', webRouter);
app.use('/', fornoRossoRouter);

module.exports = app;
