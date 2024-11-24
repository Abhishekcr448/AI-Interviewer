import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase'; // Import Firebase authentication
import { signOut } from 'firebase/auth'; // Import signOut from firebase/auth
import './Home.css';
import { FaSun, FaMoon } from 'react-icons/fa';

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(false); // State to manage dark mode
  const navigate = useNavigate(); // Hook to navigate between routes

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Function to start the interview
  const startInterview = () => {
    navigate('/chat');
  };

  // Function to handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redirect to login page after logout
      console.log("User logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <div className={isDarkMode ? 'home-container dark-mode' : 'home-container'}>
      <header className="header">
        <div className="header-logo">AI Interviewer</div>
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="header-buttons">
          <button className="header-icon-button" onClick={toggleDarkMode}>
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className="header-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="content">
        <h1>Welcome to AI Interviewer</h1>
        <p>Prepare for your dream job with AI-powered interview simulations that adapt to your skill level and provide personalized feedback.</p>
        <button onClick={startInterview} className='startai'>Start AI Interviewer</button>

        <div className="feature-container">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <div className="feature-title">Personalized Practice</div>
            <div className="feature-description">
              Tailored questions based on your progress to help you improve.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-title">Progress Tracking</div>
            <div className="feature-description">
              Monitor your improvement with detailed analytics.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <div className="feature-title">Real-Life Scenarios</div>
            <div className="feature-description">
              Simulate interviews that reflect the latest industry standards.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
