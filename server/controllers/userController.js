import User from '../models/User.js';

export const connectLeetCode = async (req, res) => {
  try {
    const { githubUsername, leetcodeUsername } = req.body;
    
    // Validate input
    if (!githubUsername || !leetcodeUsername) {
      return res.status(400).json({ error: 'Both GitHub and LeetCode usernames are required' });
    }

    // Validate LeetCode username format
    const lcRegex = /^[a-zA-Z0-9_\-]+$/;
    if (!lcRegex.test(leetcodeUsername)) {
      return res.status(400).json({ error: 'Invalid LeetCode username format' });
    }

    const user = await User.findOneAndUpdate(
      { githubUsername },
      { leetcodeUsername },
      { new: true, upsert: true }
    );
    
    res.json({ 
      success: true,
      user: {
        githubUsername: user.githubUsername,
        leetcodeUsername: user.leetcodeUsername
      }
    });
  } catch (error) {
    console.error('Error connecting LeetCode:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

import { updateLeetcodeStats } from './leetcodeController.js';

export const getLeetCodeStats = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ githubUsername: username });
    if (!user || !user.leetcodeUsername) {
      return res.status(404).json({ 
        error: 'LeetCode account not connected for this user' 
      });
    }

    // Call the update logic to fetch latest stats from LeetCode
    await updateLeetcodeStats(req, res);

    // Do not send another response here, as updateLeetcodeStats will handle it
  } catch (error) {
    console.error('Error getting LeetCode stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
};