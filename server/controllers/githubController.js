import axios from 'axios';
import User from '../models/User.js';
import mongoose from 'mongoose';

const getGitHubHeaders = () => ({
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
});

const isConsecutiveDay = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.abs(new Date(date1) - new Date(date2)) <= oneDay;
};

export const getUserRepos = async (req, res) => {
  const { username } = req.params;
  
  try {
    // Verify GitHub user exists
    await axios.get(`https://api.github.com/users/${username}`, {
      headers: getGitHubHeaders()
    });

    // Get repositories
    const reposResponse = await axios.get(
      `https://api.github.com/users/${username}/repos?sort=updated&direction=desc`,
      { headers: getGitHubHeaders() }
    );

    const repos = reposResponse.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      pushed_at: repo.pushed_at,
      created_at: repo.created_at,
      updated_at: repo.updated_at
    }));

    res.json({
      success: true,
      repos
    });
  } catch (error) {
    console.error('GitHub API Error:', error);
    res.status(500).json({
      error: 'Failed to fetch repositories',
      details: error.response?.data?.message || error.message
    });
  }
};

export const updatePetStats = async (req, res) => {
  try {
    // 1. Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        details: 'Please try again later'
      });
    }

    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // 2. Verify GitHub user exists
    await axios.get(`https://api.github.com/users/${username}`, { headers: getGitHubHeaders() });

    // 2. Find or create user in MongoDB
    let user = await User.findOne({ githubUsername: username });
    if (!user) {
      user = new User({
        githubUsername: username,
        currentStreak: 0,
        longestStreak: 0,
        petStage: 'egg',
        lastCommitDate: null,
        totalCommits: 0
      });
      await user.save();
    }


    // 4. Get commits from last 30 days
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);
    
    const commitsResponse = await axios.get(
      `https://api.github.com/search/commits?q=author:${username}+author-date:>=${sinceDate.toISOString()}`,
      { headers: getGitHubHeaders() }
    );
    
    const commits = commitsResponse.data.items;
    const commitDates = commits.map(c => new Date(c.commit.author.date));
    const uniqueCommitDays = [...new Set(commitDates.map(d => d.toDateString()))];

    // 5. Calculate dates for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 6. Determine if user committed today
    const hasCommittedToday = uniqueCommitDays.some(d => 
      new Date(d).toDateString() === today.toDateString()
    );

    // 7. Update streak logic
    if (hasCommittedToday) {
      if (!user.lastCommitDate || new Date(user.lastCommitDate).toDateString() !== today.toDateString()) {
        if (!user.lastCommitDate || !isConsecutiveDay(today, user.lastCommitDate)) {
          user.currentStreak = 1;
        } else {
          user.currentStreak += 1;
        }
        user.lastCommitDate = today;
      }
    } else {
      if (user.lastCommitDate && !isConsecutiveDay(today, user.lastCommitDate)) {
        user.currentStreak = 0;
      }
    }

    // 8. Update longest streak
    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }

    // 9. Update pet stage
    if (user.currentStreak >= 21) user.petStage = 'evolved';
    else if (user.currentStreak >= 14) user.petStage = 'grown';
    else if (user.currentStreak >= 7) user.petStage = 'baby';
    else user.petStage = 'egg';

    // 10. Update total commits
    user.totalCommits = commits.length;
    await user.save();

    // 11. Prepare response
    const streakSame = user.lastCommitDate && 
      new Date(user.lastCommitDate).toDateString() === yesterday.toDateString() &&
      !hasCommittedToday;

    return res.json({
      success: true,
      username: user.githubUsername,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      currentLeetcodeStreak: user.currentLeetcodeStreak || 0,
      leetcodeUsername: user.leetcodeUsername,
      petStage: user.petStage,
      totalCommits: user.totalCommits,
      lastCommitDate: user.lastCommitDate,
      streakSame: null,
      message: getPetMessage(user.petStage)
    });

  } catch (error) {
    console.error('Error in updatePetStats:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to update pet stats';
    
    if (error.response?.status === 404) {
      statusCode = 404;
      errorMessage = 'GitHub user not found';
    } else if (error.response?.status === 403) {
      statusCode = 429;
      errorMessage = 'GitHub API rate limit exceeded';
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.response?.data?.message || error.message
    });
  }
};

const getPetMessage = (petStage) => {
  const messages = {
    egg: "Keep committing daily to hatch your egg!",
    baby: "Your pet is growing! Maintain your streak.",
    grown: "Great job! Your pet is thriving.",
    evolved: "Amazing! Your pet has fully evolved."
  };
  return messages[petStage] || "Start committing to grow your pet!";
};

// Additional controller functions
export const getRepoCommits = async (req, res) => {
  const { owner, repo } = req.params;
  
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      { headers: getGitHubHeaders() }
    );
    
    res.json({
      success: true,
      commits: response.data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url
      }))
    });
  } catch (error) {
    handleGitHubError(res, error, 'Failed to fetch repository commits');
  }
};

export const getUserCommits = async (req, res) => {
  const { username } = req.params;
  
  try {
    const response = await axios.get(
      `https://api.github.com/search/commits?q=author:${username}`,
      { headers: getGitHubHeaders() }
    );
    
    res.json({
      success: true,
      total: response.data.total_count,
      commits: response.data.items.map(commit => ({
        repo: commit.repository.name,
        message: commit.commit.message,
        date: commit.commit.author.date,
        url: commit.html_url
      }))
    });
  } catch (error) {
    handleGitHubError(res, error, 'Failed to fetch user commits');
  }
};

// Shared error handler
const handleGitHubError = (res, error, defaultMessage) => {
  console.error('GitHub API Error:', error.message);
  
  let statusCode = 500;
  let errorMessage = defaultMessage;
  
  if (error.response) {
    statusCode = error.response.status;
    errorMessage = error.response.data.message || defaultMessage;
  }
  
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    details: error.response?.data || error.message
  });
};