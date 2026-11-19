require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is missing in .env'); process.exit(1); }

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many login attempts. Try again later.' } }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/reports', require('./routes/reports'));

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));

app.use((err, _req, res, _next) => {
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Duplicate entry: that record already exists.' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Referenced record does not exist.' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`EIMS API running on http://localhost:${port}`));
