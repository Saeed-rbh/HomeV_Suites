const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

// ── Startup Guards ────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start safely.');
}

const app = express();
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

let CORS_WHITELIST = [process.env.FRONTEND_URL].filter(Boolean);

// Add localhost to CORS whitelist only in development
if (process.env.NODE_ENV === 'development') {
  CORS_WHITELIST.push('http://localhost:3000', 'http://localhost:3001');
}

const io = new Server(server, {
  cors: {
    origin: CORS_WHITELIST,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Real-time Messaging User Connected:', socket.id);
  
  socket.on('join_thread', (threadId) => {
    socket.join(threadId);
    console.log(`User joined thread room: ${threadId}`);
  });
  
  socket.on('send_message', (data) => {
    // Escalate the message packet dynamically across users locked in the same thread ID
    socket.to(data.threadId).emit('receive_message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User Disconnected:', socket.id);
  });
});

require('./services/automations')(io);
require('./services/imapListener').startIMAPListener();
require('./services/telegramListener').startTelegramListener(io);

app.use(helmet()); // Adds basic HTTP security headers
app.use(cors({
  origin: CORS_WHITELIST,
  credentials: true,
}));

// Preserve raw body for webhook signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json());

// ── Global Rate Limiter ───────────────────────────────────────────────────────
// 100 requests per minute per IP across all /api routes.
// Webhooks are excluded because they originate from Uplisting's servers (not user IPs).
const { apiLimiter: globalApiLimiter } = require('./middleware/rateLimiter');
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/webhooks')) return next(); // exclude webhook path
  return globalApiLimiter(req, res, next);
});

try {
  // Health check
  app.get('/api/health', async (req, res) => {
    try {
      // Basic DB check to ensure DB is alive
      const prisma = require('./db');
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', message: 'Backend and Database are running' });
    } catch (e) {
      res.status(503).json({ status: 'error', message: 'Database connection failed' });
    }
  });

  // Guesty Proxy routes
  app.use('/api/guesty', require('./routes/guesty'));

  // Phase 1 Routes — registered before auth to ensure they are always available
  const propertyController = require('./controllers/propertyController');
  const { protect: authMiddleware } = require('./middleware/auth');
  const { authorize } = require('./middleware/auth');
  const { apiLimiter } = require('./middleware/rateLimiter');
  // Admin-only: triggers a full Uplisting property pull. Rate-limited + auth-guarded.
  app.post('/api/properties/sync', apiLimiter, authMiddleware, authorize('ADMIN', 'SUPER_ADMIN'), propertyController.syncProperties);
  app.use('/api/properties', require('./routes/propertyRoutes'));
  app.use('/api/guests', require('./routes/guestRoutes'));
  app.use('/api/reservations', require('./routes/reservationRoutes'));
  app.use('/api/cancellation-policies', require('./routes/cancellationPolicyRoutes'));

  // Phase 2 Routes
  app.use('/api/calendar', require('./routes/calendarRoutes'));
  app.use('/api/messaging', require('./routes/messagingRoutes'));
  app.use('/api/tasks', require('./routes/taskRoutes'));

  // Phase 3 Routes
  app.use('/api/transactions', require('./routes/transactionRoutes'));
  app.use('/api/pricing', require('./routes/pricingRoutes'));
  app.use('/api/accounting', require('./routes/accountingRoutes'));
  app.use('/api/stripe', require('./routes/stripeRoutes'));

  // Site settings (contact info, social links) — public GET, admin PUT
  app.use('/api/settings', require('./routes/settingsRoutes'));

  // Webhooks
  app.use('/api/webhooks', require('./routes/webhookRoutes'));

  // Admin access control route
  app.use('/api/admin', require('./routes/admin'));

  // Admin profile routes
  app.use('/api/admin/profile', require('./routes/profileRoutes'));


  // Static file serving for uploaded assets (avatars etc.)
  const path = require('path');
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Auth routes — keep last since middleware has compatibility issues in some envs
  app.use('/api/auth', require('./routes/auth'));

  app.get('/', (req, res) => {
    res.send('HomEV Backend Service is Running. Access the frontend on http://localhost:3001');
  });
} catch (error) {
  console.error('ERROR LOADING ROUTES:', error);
}

// ── Global Error Handler ──────────────────────────────────────────────────────
// Must be registered AFTER all routes. Catches any error passed via next(err).
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

server.listen(PORT, () => {
  console.log(`Server is running natively with WebSocket support on port ${PORT}`);
});
