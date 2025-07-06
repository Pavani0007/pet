import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import githubRouter from './routes/github.js';
import rateLimit from 'express-rate-limit';
dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);



const connectWithRetry = async () => {
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      attempts++;
      console.log(`MongoDB connection failed (attempt ${attempts}):`, err.message);
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  console.error('Could not connect to MongoDB after', maxAttempts, 'attempts');
  process.exit(1);
};

connectWithRetry();

app.use(cors());
app.use(express.json());

app.use('/api', githubRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});