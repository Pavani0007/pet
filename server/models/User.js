import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubUsername: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  leetcodeUsername: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_\-]+$/.test(v);
      },
      message: props => `${props.value} is not a valid LeetCode username!`
    }
  },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  petStage: { type: String, default: 'egg' },
  lastCommitDate: Date,
  lastLeetcodeDate: Date,
  totalCommits: { type: Number, default: 0 },
  totalLeetcode: { type: Number, default: 0 },
  currentLeetcodeStreak: { type: Number, default: 0 },
  lastLeetcodeSubmission: Date,
  currentLeetcodeStreak: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('User', userSchema);