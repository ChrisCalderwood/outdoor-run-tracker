import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import './App.css';

export default function History() {
  const [runs, setRuns] = useState([]);
  const navigate      = useNavigate();

  useEffect(() => {
    async function load() {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens.idToken;
      const res = await axios.get('/api/runs', {
        headers: { Authorization: idToken }
      });
      setRuns(res.data);
    }
    load();
  }, []);

  return (
    <div className="history">
      <h2>Your Run History</h2>
      {/* Back button */}
      <button
        className="btn-nav"
        onClick={() => navigate('/')}
        style={{ marginBottom: '1rem' }}
      >
        ← Back to Tracker
      </button>
      {runs.length === 0 ? (
        <p>No runs recorded yet.</p>
      ) : (
        <ul className="run-list">
          {runs.map(run => (
            <li key={run.runId}>
              <strong>
                {new Date(run.startTime).toLocaleString()}
              </strong>
              <button 
                onClick={() => navigate(`/summary/${run.runId}`)}
                className="btn-primary"
                >
                View Summary
                </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
