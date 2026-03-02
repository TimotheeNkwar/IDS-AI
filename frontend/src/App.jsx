import React, { useState, useEffect } from 'react';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('Backend unavailable'));

    fetch('/api/alerts')
      .then((res) => res.json())
      .then((data) => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]));
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <h1>IDS-AI Dashboard</h1>
      <p>
        <strong>System Status:</strong> {status}
      </p>
      <h2>Recent Alerts</h2>
      {alerts.length === 0 ? (
        <p>No alerts detected.</p>
      ) : (
        <ul>
          {alerts.map((alert, index) => (
            <li key={alert.id ?? index}>
              [{alert.timestamp}] {alert.type}: {alert.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
