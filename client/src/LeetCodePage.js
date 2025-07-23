/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

const LeetCodePage = () => {
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const navigate = useNavigate();
  const username = localStorage.getItem('github-username') || '';

  const API_BASE_URL = 'http://localhost:5000';
  // Use currentStreakAny if currentStreak is 0
  

  const fetchLeetCodeStats = useCallback(async (manualRefresh = false) => {
    if (!username) return;
    
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/user/leetcode/${username}`);
      setLeetcodeData(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch LeetCode stats');
    } finally {
      setLoading(false);
    }
  }, [username, API_BASE_URL]);

  useEffect(() => {
    fetchLeetCodeStats();
  }, [fetchLeetCodeStats]);

  const handleRefresh = () => {
    fetchLeetCodeStats(true);
  };

  const handleBackToPet = () => {
    navigate('/');
  };

  const handleConnectAccount = () => {
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="header-row">
        <div>
          <h2>{username}'s LeetCode Stats</h2>
          {lastUpdated && (
            <p className="last-updated">Last updated: {lastUpdated}</p>
          )}
        </div>
        <div className="action-buttons">
          {leetcodeData && (
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className={`action-button secondary ${loading ? 'refreshing' : ''}`}
            >
              {loading ? 'Refreshing...' : '↻ Refresh Stats'}
            </button>
          )}
          <button onClick={handleBackToPet} className="action-button">
            Back to My Pet
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading LeetCode stats...</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <div className="leetcode-stats-container">
          {leetcodeData ? (
            <>
              <div className="leetcode-profile">
                <h3>
                  <a 
                    href={`https://leetcode.com/${leetcodeData.username}/`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {leetcodeData.username}
                  </a>
                </h3>
                <p>
                Last activity: {leetcodeData.lastUpdated 
                  ? new Date(leetcodeData.lastUpdated).toLocaleDateString() 
                  : 'Never'}
              </p>
              </div>

              <div className="leetcode-cards">
                <div className="leetcode-card total">
                  <h4>Total Solved</h4>
                  <div className="leetcode-count">{leetcodeData.totalSolved}</div>
                </div>

                <div className="leetcode-card easy">
                  <h4>Easy</h4>
                  <div className="leetcode-count">{leetcodeData.easySolved || 0}</div>
                </div>

                <div className="leetcode-card medium">
                  <h4>Medium</h4>
                  <div className="leetcode-count">{leetcodeData.mediumSolved || 0}</div>
                </div>

                <div className="leetcode-card hard">
                  <h4>Hard</h4>
                  <div className="leetcode-count">{leetcodeData.hardSolved || 0}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="leetcode-connect">
              <p>No LeetCode account connected</p>
              <button 
                onClick={handleConnectAccount}
                className="action-button"
              >
                Connect Account
              </button>
            </div>
          )}
          

    {leetcodeData && (
      <div className="leetcode-profile">
        <h3>
          <a 
            href={`https://leetcode.com/${leetcodeData.username}/`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
           
          </a>
            </h3>
            
            {leetcodeData.todaysSubmissionCount > 0 ? (
              <p style={{ color: "#00b894", fontWeight: 600 }}>
              ✅ You have {leetcodeData.todaysSubmissionCount} accepted submission{leetcodeData.todaysSubmissionCount > 1 ? 's' : ''} today!
              </p>
            ) : (
              <p style={{ color: "#d63031", fontWeight: 600 }}>
                ⏳ No submissions yet today.
              </p>
            )}
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default LeetCodePage;