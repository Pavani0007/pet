import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PetPage from './PetPage';
import ReposPage from './ReposPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>GitHub Companion</h1>
          <nav className="main-nav">
            <Link to="/" className="nav-link">My Pet</Link>
            <Link to="/repos" className="nav-link">My Repos</Link>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<PetPage />} />
            <Route path="/repos" element={<ReposPage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>Keep coding to grow your companion!</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;