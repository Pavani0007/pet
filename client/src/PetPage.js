import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import './App.css';

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
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5000/api';

  // Add retry logic and better loading states
const [retryCount, setRetryCount] = useState(0);

const fetchPetData = useCallback(async () => {
  if (!username) return;
  
  setLoading(true);
  setError('');
  try {
    const res = await axios.get(`${API_BASE_URL}/pet/${username}`);
    setPetData(res.data);
    
    if (res.data.petStage === 'evolved') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  } catch (err) {
    if (err.response?.status === 429) {
      // Rate limited - suggest adding token
      setError('GitHub API limit reached. Try again later or add a GitHub token.');
    } else {
      setError(err.response?.data?.error || 'Failed to fetch pet data');
    }
    setRetryCount(prev => prev + 1);
  }
  setLoading(false);
}, [username]);

// Auto-retry with exponential backoff
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
          {loading ? (
            <>
              <span className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </>
          ) : (
            'Get My Pet'
          )}
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
                <span className="stat-label">Current Streak:</span>
                <span className="stat-value">{petData.currentStreak ?? 0} days</span>
                {petData.currentStreak > 0 && <span className="fire-emoji">🔥</span>}
              </div>
              
              <div className="stat-row">
                <span className="stat-label">Longest Streak:</span>
                <span className="stat-value">{petData.longestStreak} days</span>
              </div>
              
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${((petData.currentStreak ?? 0) / 21) * 100}%` }}

                  ></div>
                </div>
                <div className="progress-text">
                  {Math.round((1-(petData.currentStreak ?? 0) / 21) * 100)}% to next evolution

                </div>
              </div>
              
              <button 
                onClick={handleViewRepos}
                className="action-button secondary"
              >
                View My Repositories
              </button>
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