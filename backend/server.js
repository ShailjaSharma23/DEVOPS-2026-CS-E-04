const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const client = require('prom-client');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Initialize Prometheus Default Metrics (CPU, Memory, Event Loop)
client.collectDefaultMetrics({ timeout: 5000 });

// Custom HTTP Request Duration Histogram
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 750, 1000, 2000]
});

// Middleware to record request metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const routePath = req.route ? req.route.path : req.path;
    httpRequestDurationMicroseconds
      .labels(req.method, routePath, res.statusCode)
      .observe(duration);
  });
  next();
});

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Apply Login Rate Limiting to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// Import API routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const datasetRoutes = require('./routes/datasets');
const analyticsRoutes = require('./routes/analytics');
const forecastRoutes = require('./routes/forecasts');
const auditRoutes = require('./routes/audit');

// Route Registrations
app.use('/api/v1/auth', loginLimiter, authRoutes); // Apply rate limiter to auth routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/datasets', datasetRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/forecasts', forecastRoutes);
app.use('/api/v1/audit', auditRoutes);

// Prometheus Scrape Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Root Liveness Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', services: 'ASTRA Gateway Operational', timestamp: new Date() });
});

// Standard Error Envelope Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ASTRA Server running in mode on port ${PORT}`);
});
