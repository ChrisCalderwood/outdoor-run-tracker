import React, { useState, useRef } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const [tracking, setTracking] = useState(false);
  const [pointsCount, setPointsCount] = useState(0);
  const [summary, setSummary] = useState(null);
  const runIdRef = useRef(null);
  const intervalIdRef = useRef(null);

  const handleStartStop = () => {
    if (!tracking) {
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

              setPointsCount(count => count + 1);
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
    <div className="container">
      <div className="card">
        <h1>Outdoor Run Tracker</h1>
        <p>Points sent to server: {pointsCount}</p>
        <button onClick={handleStartStop}>
          {tracking ? 'Stop Run' : 'Start Run'}
        </button>

        {/* Conditionally show the run summary once it’s available */}
        {summary && (
          <div className="stats-card">
            <h2>Run Summary</h2>
            <p>Distance: {(summary.totalDistanceMeters / 1000).toFixed(2)} km</p>
            <p>Time: {Math.round(summary.totalTimeSeconds)} sec</p>
            <p>Avg Speed: {(summary.averageSpeedMps * 3.6).toFixed(2)} km/h</p>
            <p>Top Speed: {(summary.maxSpeedMps * 3.6).toFixed(2)} km/h</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;