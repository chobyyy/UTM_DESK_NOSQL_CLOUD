const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { DATABASE_UNAVAILABLE } = require('./utils/databaseErrors');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('MongoDB desconectado');
    await mongoose.connection.db.command({ ping: 1 }, { timeoutMS: 2000 });
    return res.json({ status: 'ok', service: 'utm-desk-api', database: 'connected' });
  } catch {
    return res.status(503).json({
      status: 'unavailable', service: 'utm-desk-api', database: 'unavailable', ...DATABASE_UNAVAILABLE
    });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
