/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import './App.css';
import LeetCodeForm from './components/LeetCodeForm';

const PetPage = () => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('github-username') || '';
  });

  const handleUsernameChange = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    localStorage.setItem('github-username', newUsername);
  };

  const [petData, setPetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [streakSame, setStreakSame] = useState(false);
  const [showLeetCodeForm, setShowLeetCodeForm] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5000';

  const fetchPetData = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/pet/${username}`);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (res.data.lastCommitDate) {
        const lastCommitDate = new Date(res.data.lastCommitDate);
        setStreakSame(
          lastCommitDate.toDateString() === yesterdayStr &&
          res.data.currentStreak > 0
        );
      } else {
        setStreakSame(false);
      }

      setPetData(res.data);
      

      // Calculate current pet stage based on max streak
      const maxStreak = Math.max(res.data.currentStreak ?? 0, res.data.currentLeetcodeStreak ?? 0);
      let calculatedStage = 'egg';
      if (maxStreak >= 21) calculatedStage = 'evolved';
      else if (maxStreak >= 14) calculatedStage = 'grown';
      else if (maxStreak >= 7) calculatedStage = 'baby';
      console.log('Max Streak:', maxStreak, 'Stage:', calculatedStage);
      
      // Override the petStage with our calculation
      res.data.petStage = calculatedStage;

      if (calculatedStage === 'evolved') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (err) {
      // In PetPage.js, inside catch block of fetchPetData
      if (err.response?.status === 404) {
        setError('GitHub user not found. Please check your username.');
      } else if (err.response?.status === 429) {
        setError('GitHub API limit reached. Try again later or add a GitHub token.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch pet data');
      }
      setRetryCount(prev => prev + 1);
    }
    setLoading(false);
  }, [username, API_BASE_URL]);

  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        fetchPetData();
      }, Math.min(1000 * 2 ** retryCount, 30000));
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, fetchPetData]);

  useEffect(() => {
    fetchPetData();
  }, [fetchPetData]);

  const handleViewRepos = () => {
    navigate('/repos', { state: { username } });
  };

  
  const getMotivationalMessage = () => {
    if (!petData) return '';
    const messages = {
      egg: [
        "Every commit brings you closer to hatching!",
        "Your first commit is the start of something great!"
      ],
      baby: [
        "Look at you go! Your pet is growing!",
        `${7 - (petData.currentStreak % 7)} more days until the next stage!`
      ],
      grown: [
        "You're on fire! Keep it up!",
        "Your consistency is impressive!"
      ],
      evolved: [
        "You're a coding machine!",
        "Your pet is thriving thanks to your dedication!"
      ]
    };

    const stageMessages = messages[petData.petStage] || ["Keep committing to grow your pet!"];
    return stageMessages[Math.floor(Math.random() * stageMessages.length)];
  };

  return (
    <div className="page-container">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <div className="input-section">
        <input
          value={username}
          onChange={handleUsernameChange}
          placeholder="Enter GitHub username"
          className="username-input"
        />

        <button 
          onClick={fetchPetData} 
          disabled={loading}
          className="action-button"
        >
          {loading ? 'Loading...' : 'Get My Pet'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {petData && (
        <>
          <div className="pet-display">
            <div className={`pet-image ${petData.petStage}`}>
              {getPetEmoji(petData.petStage)}
              <div className="pet-level">Level: {petData.petStage}</div>
            </div>

            <div className="stats-container">
              <h2>{username}'s Coding Companion</h2>
              <p className="motivation-message">{getMotivationalMessage()}</p>

              <div className="stat-row">
                <span className="stat-label">Overall Streak:</span>
                <span className="stat-value">
                  {Math.max(petData.currentStreak ?? 0, petData.currentLeetcodeStreak ?? 0)} days
                </span>
                {(petData.currentStreak > 0 || petData.currentLeetcodeStreak > 0) && <span className="fire-emoji">🔥</span>}
              </div>

              <div className="stat-row tooltip-container">
                <span className="stat-label">Longest Overall Streak:</span>
                <span className="stat-value">{Math.max(petData.longestStreak ?? 0, petData.longestLeetcodeStreak ?? 0)} days</span>
                
              </div>

              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(Math.max(petData.currentStreak ?? 0, petData.currentLeetcodeStreak ?? 0) / 21) * 100}%` 
                    }}
                  />
                </div>
                <div className="progress-text">
                  {Math.round((1 - (Math.max(petData.currentStreak ?? 0, petData.currentLeetcodeStreak ?? 0) / 21)) * 100)}% to next evolution
                </div>
              </div>

              <button 
                onClick={handleViewRepos}
                className="action-button secondary"
              >
                View My Repositories
              </button>

              <div className="leetcode-section">
                {!petData.leetcodeUsername && !showLeetCodeForm && (
                  <button 
                    onClick={() => setShowLeetCodeForm(true)}
                    className="action-button secondary"
                    style={{ marginTop: '1rem' }}
                  >
                    Connect LeetCode Account
                  </button>
                )}

                {showLeetCodeForm && (
                  <LeetCodeForm 
                    githubUsername={username} 
                    onClose={() => {
                      setShowLeetCodeForm(false);
                      fetchPetData();
                    }} 
                  />
                )}

                {petData.leetcodeUsername && (
                  <div className="leetcode-connected">
                    <p>Connected to LeetCode: <strong>{petData.leetcodeUsername}</strong></p>
                    <button 
                      onClick={() => setShowLeetCodeForm(true)}
                      className="action-button secondary"
                    >
                      Change Account
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="evolution-path">
              <h3>Evolution Path</h3>
              <div className="evolution-stages">
                <div className={`stage ${petData.petStage === 'egg' ? 'active' : ''}`}>
                  <span>🥚 Egg</span>
                  <p>0-6 days</p>
                </div>
                <div className={`stage ${petData.petStage === 'baby' ? 'active' : ''}`}>
                  <span>🐣 Baby</span>
                  <p>7-13 days</p>
                </div>
                <div className={`stage ${petData.petStage === 'grown' ? 'active' : ''}`}>
                  <span>🐥 Grown</span>
                  <p>14-20 days</p>
                </div>
                <div className={`stage ${petData.petStage === 'evolved' ? 'active' : ''}`}>
                  <span>🐔 Evolved</span>
                  <p>21+ days</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const getPetEmoji = (stage) => {
  switch(stage) {
    case 'egg': return '🥚';
    case 'baby': return '🐣';
    case 'grown': return '🐥';
    case 'evolved': return '🐔';
    default: return '❓';
  }
};

export default PetPage;