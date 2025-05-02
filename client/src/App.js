import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { v4 as uuidv4 } from 'uuid';
import { Routes, Route, useNavigate } from 'react-router-dom';
import History from './history';
import Summary from './summary';
import './App.css';

function App() {
  const navigate = useNavigate();
  const { signOut } = useAuthenticator(context => []);
  const [tracking, setTracking] = useState(false);
  const [summary, setSummary] = useState(null);
  const runIdRef = useRef(null);
  const intervalIdRef = useRef(null);

   // Two Geolocation option sets for high vs. low accuracy:
   const GEO_OPTIONS_HIGH = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10000,
  };
  const GEO_OPTIONS_LOW = {
    enableHighAccuracy: false,
    maximumAge: 0,
    timeout: 15000,
  };

  // Success handler — pulls the session, POSTs to /api/location
  async function handlePositionSuccess(position) {
    const data = {
      runId: runIdRef.current,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      // server assigns timestamp, so we don’t send it
    };

    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens.idToken;
      await axios.post('/api/location', data, {
        headers: { Authorization: idToken }
      });
      console.log('Location saved:', data);
    } catch (err) {
      console.error('Error saving location:', err);
    }
  }

  // Error handler — on timeout, retry with low-accuracy settings
  function handlePositionError(err) {
    console.error('Geolocation error:', err);
    if (err.code === err.TIMEOUT || err.code === 3) {
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        handlePositionError,
        GEO_OPTIONS_LOW
      );
    }
  }

  const handleStartStop = () => {
    if (!tracking) {
      setSummary(null); // clear the last summary
      runIdRef.current = uuidv4();

      // 4) Start polling using the named handlers & high-accuracy options
      intervalIdRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          handlePositionSuccess,
          handlePositionError,
          GEO_OPTIONS_HIGH
        );
      }, 10000);

      setTracking(true);
    } else {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
      setTracking(false);
      fetchSummary(runIdRef.current);
    }
  };

  const fetchSummary = async runId => {
    try {
      const { tokens } = await fetchAuthSession();
      const idToken    = tokens.idToken;

      const res = await axios.get(`/api/summary/${runId}`, {
        headers: { Authorization: idToken }
      });
      setSummary(res.data);
    } catch (e) {
      console.error('Summary error', e);
    }
  };

  return (
    <div className="app">
      {/* put your nav controls in their own flex container */}
      <div className="nav-buttons">
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/history')}
        >
          Run History
        </button>
        <button 
          className="btn-secondary" 
          onClick={signOut}
        >
          Sign Out
        </button>
      </div>

      <div className="card">
        <header className="card-header">
          <h1 className="title">Outdoor Run Tracker</h1>
        </header>

        <div className="card-body">
          {/* Welcome blurb */}
          <p className="welcome">
            Welcome to Run Tracker! <br />
            You can track and review your runs and stats. <br />
            Tap “Start Run” to begin, then tap again to finish. <br />
            View past runs with “Run History”. <br />
            Happy running! <br />
          </p>
          <button className="btn-primary" onClick={handleStartStop}>
            {tracking ? 'Finish Run' : 'Start Run'}
          </button>
          {/* Note about location permissions */}
          <p className="note">
            Note: Please enable location services in your browser settings for this app to work.
          </p>
        </div>

        {summary && (
          <div className="stats-card">
            <h2>Run Summary</h2>
            {summary.message ? (
              <p>{summary.message}</p>
            ) : (
              <>
                <p>Distance: {(summary.totalDistanceMeters/1000).toFixed(2)} km</p>
                <p>Time: {Math.round(summary.totalTimeSeconds)} sec</p>
                <p>Avg Speed: {(summary.averageSpeedMps*3.6).toFixed(2)} km/h</p>
                <p>Top Speed: {(summary.maxSpeedMps*3.6).toFixed(2)} km/h</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Root() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/history" element={<History />} />
      <Route path="/summary/:runId" element={<Summary />} />
    </Routes>
  );
}