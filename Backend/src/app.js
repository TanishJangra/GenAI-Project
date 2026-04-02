const express = require('express');
const app = express();
const cookies = require('cookie-parser');
const cors = require('cors');

app.use(express.json());
app.use(cookies());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

const authRouter = require('./routes/auth.routes');

app.use('/api/auth', authRouter);

module.exports = app;