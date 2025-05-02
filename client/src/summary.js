import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';

export default function Summary() {
  const { runId } = useParams();
  const navigate  = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { tokens } = await fetchAuthSession();
        const idToken = tokens.idToken;
        const res = await axios.get(`/api/summary/${runId}`, {
          headers: { Authorization: idToken }
        });
        setSummary(res.data);
      } catch (e) {
        setError('Failed to load summary');
      }
    }
    load();
  }, [runId]);

  if (error) return <p className="error">{error}</p>;
  if (!summary) return <p>Loading…</p>;

  return (
    <div className="summary-page">
      <button className="btn-nav summary-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="card summary-card">
        <header className="card-header">
          <h2 className="title">Run Summary</h2>
        </header>
        <div className="stats-card">
          {summary.message ? (
            <p>{summary.message}</p>
          ) : (
            <>
              <p>Distance: {(summary.totalDistanceMeters / 1000).toFixed(2)} km</p>
              <p>Time: {Math.round(summary.totalTimeSeconds)} sec</p>
              <p>Avg Speed: {(summary.averageSpeedMps * 3.6).toFixed(2)} km/h</p>
              <p>Top Speed: {(summary.maxSpeedMps * 3.6).toFixed(2)} km/h</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}