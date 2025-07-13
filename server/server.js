import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import githubRouter from './routes/github.js';
import userRouter from './routes/user.js';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS'
});

// Database connection
const connectWithRetry = async () => {
  let attempts = 0;
  const maxAttempts = 5;
  const retryDelay = 5000;

  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority'
      });
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      attempts++;
      console.error(`MongoDB connection failed (attempt ${attempts}):`, err.message);
      
      if (attempts === maxAttempts) {
        console.error('Could not connect to MongoDB after maximum attempts');
        process.exit(1);
      }
      
      await new Promise(res => setTimeout(res, retryDelay));
    }
  }
};

// Wait for database connection before starting server
await connectWithRetry();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use('/api', apiLimiter);

// Routes - CORRECTED MOUNTING POINTS
app.use('/api', githubRouter);  // Handles /api/pet/:username and /api/user-repos/:username
app.use('/api/user', userRouter); // Handles /api/user/leetcode and /api/user/leetcode/:username

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Not found handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl
  });
});

// Server startup
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Server and MongoDB connection closed');
      process.exit(0);
    });
  });
};

['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
  process.on(signal, shutdown);
});