import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';

const PetDisplay = ({ username }) => {
  const [petData, setPetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPetData = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/pet/${username}`);
      setPetData(res.data);
      
      // Show confetti when pet evolves
      if (res.data.petStage === 'evolved' || res.data.currentStreak % 7 === 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch pet data');
    }
    setLoading(false);
  }, [username, API_BASE_URL]);

  useEffect(() => {
    if (username) {
      fetchPetData();
      const interval = setInterval(fetchPetData, 3600000); // Refresh hourly
      return () => clearInterval(interval);
    }
  }, [username, fetchPetData]);

  const getPetImage = () => {
    if (!petData) return '';
    switch(petData.petStage) {
      case 'egg': return '🥚';
      case 'baby': return '🐣';
      case 'grown': return '🐥';
      case 'evolved': return '🐔';
      default: return '❓';
    }
  };

  const getStreakPercentage = () => {
    if (!petData) return 0;
    return Math.min(100, (petData.currentStreak / 21) * 100);
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
    <div className="pet-container">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your coding companion...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={fetchPetData} className="retry-button">
            Try Again
          </button>
        </div>
      ) : petData ? (
        <>
          <div className="pet-display">
            <div className={`pet-image ${petData.petStage}`}>
              {getPetImage()}
              <div className="pet-level">Level: {petData.petStage}</div>
            </div>
            
            <div className="pet-stats">
              <h2>{username}'s Coding Companion</h2>
              <p className="motivation">{getMotivationalMessage()}</p>
              
              <div className="stat-item">
                <span className="stat-label">Current Streak:</span>
                <span className="stat-value">{petData.currentStreak} days</span>
                {petData.currentStreak > 0 && (
                  <span className="streak-fire">🔥</span>
                )}
              </div>
              
              <div className="stat-item">
                <span className="stat-label">Longest Streak:</span>
                <span className="stat-value">{petData.longestStreak} days</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-label">Total Commits:</span>
                <span className="stat-value">{petData.totalCommits}</span>
              </div>
              
              <div className="progress-container">
                <div className="progress-label">
                  Progress to next stage: {Math.round(getStreakPercentage())}%
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${getStreakPercentage()}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="last-commit">
                Last commit: {petData.lastCommitDate ? 
                  new Date(petData.lastCommitDate).toLocaleString() : 'Never'}
              </div>
            </div>
          </div>
          
          <div className="encouragement-banner">
            {petData.currentStreak > 0 ? (
              <p>You're on a {petData.currentStreak}-day streak! Commit today to keep it going!</p>
            ) : (
              <p>Start a new streak today with your first commit!</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default PetDisplay;