import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubUsername: {
    type: String,
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastCommitDate: {
    type: Date,
    default: null
  },
  petStage: {
    type: String,
    enum: ['egg', 'baby', 'grown', 'evolved'],
    default: 'egg'
  },
  totalCommits: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);