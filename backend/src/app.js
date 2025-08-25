const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./config/passport');
const { 
  generalLimiter, 
  aiGenerationLimiter, 
  authLimiter,
  worksheetSubmissionLimiter 
} = require('./middleware/rateLimitMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const worksheetRoutes = require('./routes/worksheetRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const kidProfileRoutes = require('./routes/kidProfileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const llmRoutes = require('./routes/llmRoutes');

const app = express();

// Trust proxy for nginx
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration - simplified for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// Import logger
const logger = require('./utils/logger');

// Logging middleware
app.use(morgan('combined', { stream: logger.stream }));

// Body parser middleware - Skip for webhook endpoint
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/worksheets', worksheetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/kid-profiles', kidProfileRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/llm', llmRoutes);

// Import error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
