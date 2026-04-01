const express = require('express');
const app = express();
const cookies = require('cookie-parser');

app.use(express.json());
app.use(cookies());

const authRouter = require('./routes/auth.routes');

app.use('/api/auth', authRouter);

module.exports = app;