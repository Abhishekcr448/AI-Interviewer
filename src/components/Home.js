import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { FaSun, FaMoon } from 'react-icons/fa';
import Modal from './Modal';
import './Home.css';
import logo from './assests/AI_V.webp';

const Home = () => {
  // State variables
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    theoreticalQuestions: 2,
    theoreticalTopics: [],
    diagramQuestions: 0,
    diagramTopics: [],
    codingQuestions: 0,
    difficulty: 'Easy'
  });

  const navigate = useNavigate();
  const uid = useLocation().state;

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Handle start interview button click
  const handleStartInterview = () => {
    setIsModalOpen(true);
  };

  // Handle modal submit
  const handleModalSubmit = (data) => {
    setIsModalOpen(false);
    navigate("/chat", { state: { uid, data } });
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      console.log("User logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <div className={isDarkMode ? 'home-container dark-mode' : 'home-container'}>
      <header className="header">
        <div className="header-logo">
          <img src={logo} alt="AI Interviewer" />
          <h3 style={{ color: 'white', marginTop: '10px' }}>PrepWise</h3>
        </div>
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
      <div className="header-hero-divider"></div>
      <div className="hero-section">
        <div className="hero-content">
          <h1>Your AI-Powered Interview Partner</h1>
          <p>
            Prepare for your next big job interview with intelligent, adaptive AI simulations. Practice mock interviews, get real-time feedback, and improve your skills.
          </p>
          <button className="start-interview-button" onClick={handleStartInterview}>
            Start Interview
          </button>
        </div>
      </div>

      <section id="features" className="features-section">
        <h2>Why Choose AI Interviewer?</h2>
        <div className="features-cards">
          <div className="feature-card">
            <i className="bi bi-lightbulb"></i>
            <h3>Smart Adaptation</h3>
            <p>Interviews adjust to your skill level, offering you a personalized experience.</p>
          </div>
          <div className="feature-card">
            <i className="bi bi-chat-dots"></i>
            <h3>Instant Feedback</h3>
            <p>Receive immediate insights after each question to know where you stand.</p>
          </div>
          <div className="feature-card">
            <i className="bi bi-pie-chart"></i>
            <h3>Progress Tracking</h3>
            <p>Track your interview performance and improvement over time.</p>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <h2>About AI Interviewer</h2>
        <p>
          AI Interviewer is designed to help candidates enhance their interview skills through AI simulations that emulate real-life technical and behavioral interviews.
        </p>
        <div className="about-details">
          <div>
            <h3>Who We Are</h3>
            <p>Our team is made up of software engineer students who have a deep understanding of the interview process.</p>
          </div>
          <div>
            <h3>Our Mission</h3>
            <p>Our mission is to help job seekers feel confident and prepared by providing a platform to practice interviews with realistic scenarios.</p>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <h2>Contact Us</h2>
        <p>Have any questions? Reach out to us and we’ll be happy to help!</p>
        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit">Send Message</button>
        </form>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        formData={formData}
        setFormData={setFormData}
      />
    </div>
  );
};

export default Home;
