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
      let longestStreak = 0;
      let lastLeetcodeDate = null;

      const calendar = data.submissionCalendar ? JSON.parse(data.submissionCalendar) : {};
      const now = new Date();
      const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const todayKey = Math.floor(utcMidnight.getTime() / 1000);
      const yesterdayKey = todayKey - 86400;
      const todaysSubmissionCount = calendar[todayKey] || 0;

      // Calculate current streak including today
      let currentStreak = 0;
      let dayKey = todayKey;
      
      // Check consecutive days backwards from today
      while (calendar[dayKey] && calendar[dayKey] > 0) {
        currentStreak++;
        dayKey -= 86400;
      }

      // Update user's LeetCode streak in database
      user.currentLeetcodeStreak = currentStreak;
      await user.save();

      // Calculate longest streak
      let streak = 0;
      Object.keys(calendar).sort((a, b) => a - b).forEach(ts => {
        if (calendar[ts] > 0) {
          streak++;
          if (streak > longestStreak) longestStreak = streak;
        } else {
          streak = 0;
        }
      });

      // Find last activity date
      const submissionTimestamps = Object.keys(calendar)
        .filter(ts => calendar[ts] > 0)
        .map(ts => Number(ts) * 1000);
      if (submissionTimestamps.length > 0) {
        lastLeetcodeDate = new Date(Math.max(...submissionTimestamps));
      }

      // Save the streak and update lastLeetcodeDate
      user.currentLeetcodeStreak = currentStreak;
      user.lastLeetcodeDate = lastLeetcodeDate;
      await user.save();

      res.json({
        success: true,
        username: user.leetcodeUsername,
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        currentStreak: user.currentLeetcodeStreak,
        longestStreak,
        lastUpdated: user.lastLeetcodeDate,
        solvedToday: todaysSubmissionCount > 0,
        todaysSubmissionCount,
        message: `✅ You have ${todaysSubmissionCount} accepted submission${todaysSubmissionCount === 1 ? '' : 's'} today!`
      });

    } catch (error) {
      console.error('LeetCode API Error:', error?.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch LeetCode stats' });
    }
  };