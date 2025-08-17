import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const ReposPage = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [githubStats, setGithubStats] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || localStorage.getItem('github-username') || '';

  const API_BASE_URL = 'http://localhost:5000';

  const fetchData = useCallback(async () => {
    if (!username) return;
    
    setLoading(true);
    setError('');
    try {
      const [reposRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/user-repos/${username}`),
        axios.get(`${API_BASE_URL}/api/pet/${username}`)
      ]);
      
      // Sort by pushed_at date (newest first)
      const sortedRepos = reposRes.data.repos.sort((a, b) => {
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      });

      setRepos(sortedRepos);
      setGithubStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    }
    setLoading(false);
  }, [username, API_BASE_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBackToPet = () => {
    navigate('/');
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container">
      <div className="header-row">
        <h2>{username}'s Repositories</h2>
        <button onClick={handleBackToPet} className="action-button">
          Back to My Pet
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading repositories...</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <>
          <div className="github-stats">
            <div className="stat-card">
              <h3>GitHub Streak</h3>
              <div className="stat-value">{githubStats?.currentStreak ?? 0} days {githubStats?.currentStreak > 0 && '🔥'}</div>
              <div className="stat-label">Current Streak</div>
            </div>
           
            <div className="stat-card">
              <h3>Total Commits</h3>
              <div className="stat-value">{githubStats?.totalCommits ?? 0}</div>
              <div className="stat-label">Last 30 Days</div>
            </div>
          </div>

          <div className="repo-count">
            Showing {filteredRepos.length} of {repos.length} repositories
          </div>

          <div className="repos-grid">
            {filteredRepos.map((repo) => (
              <div key={repo.id} className="repo-card">
                <h3>{repo.name}</h3>
                <p className="repo-description">
                  {repo.description || 'No description available'}
                </p>
                <div className="repo-stats">
                  <span title="Stars">⭐ {repo.stargazers_count}</span>
                  <span title="Forks">🍴 {repo.forks_count}</span>
                </div>
                <div className="repo-footer">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="repo-link"
                  >
                    View on GitHub
                  </a>
                  {repo.pushed_at && (
                    <span className="last-commit">
                      Last commit: {new Date(repo.pushed_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReposPage;