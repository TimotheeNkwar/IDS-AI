import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || '';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [healthResponse, alertsResponse] = await Promise.all([
          fetch(`${API_BASE}/health`),
          fetch(`${API_BASE}/api/alerts`),
        ]);
        const healthData = await healthResponse.json();
        const alertsData = await alertsResponse.json();
        setHealth(healthData);
        setAlerts(alertsData.alerts || []);
        setError('');
      } catch {
        setError('Backend unavailable');
      }
    }

    loadDashboard();
    const timer = setInterval(loadDashboard, 15000);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(() => {
    return alerts.reduce(
      (acc, alert) => {
        acc.total += 1;
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      },
      { total: 0, high: 0, medium: 0, low: 0 }
    );
  }, [alerts]);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>IDS-AI Dashboard</h1>
          <p style={styles.subtitle}>Hybrid ML and local LLM intrusion monitoring</p>
        </div>
        <span style={{ ...styles.badge, ...(error ? styles.badgeDown : styles.badgeUp) }}>
          {error || health?.status || 'Loading'}
        </span>
      </header>

      <section style={styles.metrics}>
        <Metric label="Alerts" value={counts.total} />
        <Metric label="High" value={counts.high} tone="high" />
        <Metric label="Medium" value={counts.medium} tone="medium" />
        <Metric label="Low" value={counts.low} tone="low" />
      </section>

      <section style={styles.panel}>
        <h2 style={styles.sectionTitle}>System</h2>
        <div style={styles.systemGrid}>
          <SystemItem label="ML model" value={health?.ml_model || 'Unavailable'} />
          <SystemItem label="ML loaded" value={health?.ml_model_loaded ? 'Yes' : 'No'} />
          <SystemItem label="LLM provider" value={health?.llm_provider || 'Unknown'} />
          <SystemItem label="LLM model" value={health?.llm_model || 'Unknown'} />
          <SystemItem label="LLM loaded" value={health?.llm_loaded ? 'Yes' : 'No'} />
          <SystemItem label="Alert storage" value={health?.alert_storage_connected ? 'Connected' : 'Unavailable'} />
        </div>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.sectionTitle}>Recent Alerts</h2>
        {alerts.length === 0 ? (
          <p style={styles.empty}>No alerts detected.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Severity</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Source</th>
                  <th style={styles.th}>Classification</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td style={styles.td}>{formatDate(alert.timestamp)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.severity, ...severityStyle(alert.severity) }}>
                        {alert.severity}
                      </span>
                    </td>
                    <td style={styles.td}>{alert.type}</td>
                    <td style={styles.td}>{alert.source_ip || '-'}</td>
                    <td style={styles.td}>{alert.classification || '-'}</td>
                    <td style={styles.td}>{alert.recommended_action || alert.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div style={{ ...styles.metric, ...(tone ? styles[`metric_${tone}`] : {}) }}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </div>
  );
}

function SystemItem({ label, value }) {
  return (
    <div style={styles.systemItem}>
      <span style={styles.systemLabel}>{label}</span>
      <strong style={styles.systemValue}>{value}</strong>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function severityStyle(severity) {
  if (severity === 'high') return styles.severityHigh;
  if (severity === 'medium') return styles.severityMedium;
  return styles.severityLow;
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f6f8fb',
    color: '#172033',
    fontFamily: 'Arial, sans-serif',
    padding: '32px',
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
    marginBottom: '24px',
  },
  title: { fontSize: '32px', margin: 0 },
  subtitle: { color: '#5d6b82', margin: '6px 0 0' },
  badge: {
    borderRadius: '999px',
    fontSize: '14px',
    fontWeight: 700,
    padding: '8px 14px',
  },
  badgeUp: { background: '#ddf7ea', color: '#126b3f' },
  badgeDown: { background: '#ffe2e2', color: '#9f1f1f' },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  metric: {
    background: '#ffffff',
    border: '1px solid #dde4ee',
    borderRadius: '8px',
    padding: '18px',
  },
  metric_high: { borderColor: '#f0a1a1' },
  metric_medium: { borderColor: '#e9c46a' },
  metric_low: { borderColor: '#9bd4b5' },
  metricLabel: { color: '#617089', display: 'block', fontSize: '13px', marginBottom: '8px' },
  metricValue: { fontSize: '28px' },
  panel: {
    background: '#ffffff',
    border: '1px solid #dde4ee',
    borderRadius: '8px',
    marginTop: '20px',
    padding: '20px',
  },
  sectionTitle: { fontSize: '18px', margin: '0 0 16px' },
  systemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  systemItem: { borderTop: '1px solid #edf1f6', paddingTop: '12px' },
  systemLabel: { color: '#617089', display: 'block', fontSize: '12px', marginBottom: '5px' },
  systemValue: { fontSize: '15px' },
  empty: { color: '#617089' },
  tableWrap: { overflowX: 'auto' },
  table: { borderCollapse: 'collapse', minWidth: '900px', width: '100%' },
  th: {
    borderBottom: '1px solid #dde4ee',
    color: '#617089',
    fontSize: '12px',
    padding: '10px',
    textAlign: 'left',
    textTransform: 'uppercase',
  },
  td: {
    borderBottom: '1px solid #edf1f6',
    fontSize: '14px',
    padding: '12px 10px',
    verticalAlign: 'top',
  },
  severity: {
    borderRadius: '999px',
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 8px',
    textTransform: 'uppercase',
  },
  severityHigh: { background: '#ffe2e2', color: '#9f1f1f' },
  severityMedium: { background: '#fff3c4', color: '#775300' },
  severityLow: { background: '#ddf7ea', color: '#126b3f' },
};

export default App;
