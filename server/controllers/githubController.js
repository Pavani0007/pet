import axios from 'axios';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Configure GitHub API headers
const GITHUB_API_CACHE = new Map();
const CACHE_DURATION = 60 * 60 * 1000;

const getGitHubHeaders = () => ({
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
});

// Helper function to check consecutive days
const isConsecutiveDay = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.abs(new Date(date1) - new Date(date2)) <= oneDay;
};


export const getUserRepos = async (req, res) => {
  const { username } = req.params;
  const cacheKey = `repos-${username}`;

  try {
    // Check cache first
    if (GITHUB_API_CACHE.has(cacheKey)) {
      const cached = GITHUB_API_CACHE.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json(cached.data);
      }
    }

    // Verify GitHub user exists
    await axios.get(`https://api.github.com/users/${username}`, {
      headers: getGitHubHeaders()
    });

    // Get all user repositories
    const reposResponse = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
      { headers: getGitHubHeaders() }
    );

    // Cache the response
    const responseData = {
      success: true,
      username,
      repos: reposResponse.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        pushed_at: repo.pushed_at,  // Add pushed_at
        created_at: repo.created_at, // Add created_at
        updated_at: repo.updated_at // Add updated_at
      }))
    };

    GITHUB_API_CACHE.set(cacheKey, {
      timestamp: Date.now(),
      data: responseData
    });

    res.json(responseData);
  } catch (error) {
    console.error('GitHub API Error:', error.message);
    
    if (error.response?.status === 403) {
      return res.status(429).json({
        error: 'GitHub API rate limit exceeded',
        details: 'Please try again later or add a GITHUB_TOKEN in your .env'
      });
    }
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch repositories',
      details: error.response?.data?.message || error.message
    });
  }
};

export const updatePetStats = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected' });
  }

  const { username } = req.params;
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  try {
    await axios.get(`https://api.github.com/users/${username}`, {
      headers: getGitHubHeaders()
    });

    let user = await User.findOne({ githubUsername: username });
    if (!user) {
      user = new User({ githubUsername: username });
    }

    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    let commits = [];

    try {
      const search = await axios.get(
        `https://api.github.com/search/commits?q=author:${username}+author-date:>=${since}`,
        { headers: getGitHubHeaders() }
      );
      commits = search.data.items.map(c => c.commit.author.date);
    } catch (e) {
      console.warn('Search API failed, falling back to repos.');
    }

    // ⛔ If search failed or returned stale data, use repo fallback
    if (!commits.some(date => date.slice(0, 10) === todayStr)) {
      const repoRes = await axios.get(
        `https://api.github.com/users/${username}/repos?per_page=100`,
        { headers: getGitHubHeaders() }
      );
      commits = repoRes.data.map(r => r.pushed_at);
    }

    const commitDays = new Set(commits.map(d => d.slice(0, 10)));

    const hasToday = commitDays.has(todayStr);
    const hasYesterday = commitDays.has(yesterdayStr);
    const lastDayStr = user.lastCommitDate?.toISOString().slice(0, 10);

    if (hasToday) {
      if (lastDayStr === todayStr) {
        // already recorded
      } else if (lastDayStr === yesterdayStr) {
        user.currentStreak += 1;
      } else {
        user.currentStreak = 1;
      }
      user.lastCommitDate = new Date();
    } else {
      if (lastDayStr !== yesterdayStr) {
        user.currentStreak = 0;
      }
    }

    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }

    // Update pet stage
    if (user.currentStreak >= 21) user.petStage = 'evolved';
    else if (user.currentStreak >= 14) user.petStage = 'grown';
    else if (user.currentStreak >= 7) user.petStage = 'baby';
    else user.petStage = 'egg';

    user.totalCommits = commits.length;
    await user.save();

    res.json({
      success: true,
      username: user.githubUsername,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      petStage: user.petStage,
      totalCommits: user.totalCommits,
      lastCommitDate: user.lastCommitDate,
      message: getPetMessage(user.petStage)
    });
  } catch (err) {
    console.error('updatePetStats error:', err.message);
    res.status(err.response?.status || 500).json({
      error: err.response?.data?.message || err.message
    });
  }
}




// Helper function for pet messages
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