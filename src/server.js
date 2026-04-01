require('dotenv').config();
const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const { getUserBookings, validateUserId } = require('./routes/bookings');

const app = express();
app.use(express.json());

// ── Swagger UI ───────────────────────────────────────────────
const swaggerDoc = yaml.load(
  fs.readFileSync(path.join(__dirname, '../docs/swagger.yaml'), 'utf8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ── Routes ───────────────────────────────────────────────────
app.use('/events', eventRoutes);
app.use('/bookings', bookingRoutes);
app.get('/users/:id/bookings', validateUserId, getUserBookings);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Unexpected server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
