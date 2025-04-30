import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tracking, setTracking] = useState(false);
  const [pointsCount, setPointsCount] = useState(0);
  const intervalIdRef = useRef(null);

  const handleStartStop = () => {
    if (!tracking) {
      // Start polling every 10 seconds
      const id = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          position => {
            const data = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: position.timestamp
            };
            // Update counter
            setPointsCount(count => count + 1);
            // Send to backend
            axios.post('/api/location', data)
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

      intervalIdRef.current = id;
      setTracking(true);
    } else {
      // Stop polling
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
      setTracking(false);
    }
  };

  return (
    <div className="app">
      <div className="card">
        <h1>Outdoor Run Tracker</h1>
        <p>Points sent to server: {pointsCount}</p>
        <button onClick={handleStartStop}>
          {tracking ? 'Stop Run' : 'Start Run'}
        </button>
      </div>
    </div>
  );
}

export default App;