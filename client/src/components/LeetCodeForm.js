import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

export const API_BASE = "https://pet-5qsa.onrender.com";

const LeetCodeForm = ({ githubUsername, onClose }) => {
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const API_BASE_URL = API_BASE;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_BASE_URL}/api/user/leetcode`, {
        githubUsername,
        leetcodeUsername
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect LeetCode account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leetcode-form">
      <h3>Connect LeetCode Account</h3>
      
      {success ? (
        <div className="success-message">
          Successfully connected to LeetCode!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={leetcodeUsername}
            onChange={(e) => setLeetcodeUsername(e.target.value)}
            placeholder="Enter LeetCode username"
            required
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="action-button cancel-button"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="action-button"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LeetCodeForm;