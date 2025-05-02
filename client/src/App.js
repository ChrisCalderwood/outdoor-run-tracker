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

  const handleStartStop = () => {
    if (!tracking) {
      setSummary(null);     // clear last summary

      // Start polling every 10 seconds
      runIdRef.current = uuidv4();
      intervalIdRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          async position => {
            const data = {
              runId: runIdRef.current,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: position.timestamp
            };

            // Get the user's ID token
            const { tokens } = await fetchAuthSession();;
            const idToken  = tokens.idToken;

            // Send to backend
            await axios.post('/api/location', data, {
              headers: { Authorization: idToken }
            })
              .then(res => console.log('Location saved:', res.data))
              .catch(err => console.error('Error saving location:', err));
          },
          error => {
            console.error('Geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
          }
        );
      }, 10000); // 10000ms = 10s

      //intervalIdRef.current = id;
      setTracking(true);
    } else {
      // Stop polling
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