import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/login.js";
import SignUp from "./components/register.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "./components/firebase.js";
import Chat from './components/Chat';
import Home from './components/Home';
import Profile from "./components/profile.js";
import InterviewAnalysis from "./components/Analysis.js";

function App() {
  const [user, setUser] = useState(null);

  // Monitor authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user);
      setUser(user);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="App">
        <div className="auth-wrapper">
          <div className="auth-inner">
            <Routes>
              {/* Redirect to home if user is authenticated, otherwise show login */}
              <Route
                path="/"
                element={user ? <Navigate to="/home" /> : <Login />}
              />
              {/* Home route, accessible only if user is authenticated */}
              <Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
              {/* Login route */}
              <Route path="/login" element={<Login />} />
              {/* Register route */}
              <Route path="/register" element={<SignUp />} />
              {/* Profile route */}
              <Route path="/profile" element={<Profile />} />
              {/* Chat route, accessible only if user is authenticated */}
              <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
              {/* Interview Analysis route */}
              <Route path="/analysis" element={<InterviewAnalysis />} />
            </Routes>
            <ToastContainer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;