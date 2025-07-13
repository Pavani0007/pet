import axios from 'axios';
import User from '../models/User.js';

const LEETCODE_API = 'https://leetcode.com/graphql';

export const updateLeetcodeStats = async (req, res) => {
  const { username } = req.params;

  try {
    // 1. Get user from database (to get leetcodeUsername)
    const user = await User.findOne({ githubUsername: username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.leetcodeUsername) {
      return res.status(400).json({ error: 'LeetCode username not set' });
    }

    // 2. Query LeetCode API for fresh stats
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          submissionCalendar
        }
      }
    `;

    const response = await axios.post(
      LEETCODE_API,
      {
        query,
        variables: { username: user.leetcodeUsername }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const data = response.data.data.matchedUser;

    if (!data) {
      return res.status(404).json({ error: 'LeetCode user not found' });
    }

    // Parse stats
    const acStats = data.submitStats.acSubmissionNum;
    const totalSolved = acStats.find(s => s.difficulty === 'All')?.count || 0;
    const easySolved = acStats.find(s => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = acStats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = acStats.find(s => s.difficulty === 'Hard')?.count || 0;

    // Parse calendar for streak
    let currentStreak = 0;
    let longestStreak = 0;
    let lastLeetcodeDate = null;

    const calendar = data.submissionCalendar ? JSON.parse(data.submissionCalendar) : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = Math.floor(today.getTime() / 1000);
    const solvedToday = calendar[todayKey] > 0;

    // Calculate streak (simple version: count consecutive days up to today)
    let streak = 0;
    let day = todayKey;
    while (calendar[day] && calendar[day] > 0) {
      streak++;
      day -= 86400; // subtract one day in seconds
    }
    currentStreak = streak;

    // Find longest streak
    // (Optional: implement a more advanced streak calculation if needed)

    // Find last activity date
    const submissionTimestamps = Object.keys(calendar)
      .filter(ts => calendar[ts] > 0)
      .map(ts => Number(ts) * 1000);
    if (submissionTimestamps.length > 0) {
      lastLeetcodeDate = new Date(Math.max(...submissionTimestamps));
    }

    res.json({
      success: true,
      username: user.leetcodeUsername,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      currentStreak,
      lastUpdated: lastLeetcodeDate,
      solvedToday
    });

  } catch (error) {
    console.error('LeetCode API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch LeetCode stats' });
  }
};