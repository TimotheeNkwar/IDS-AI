import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE || '';
const REFRESH_MS = 15000;

function App() {
  const [alerts, setAlerts] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [health, setHealth] = useState(null);
  const [activeView, setActiveView] = useState('alerts');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingAlertId, setSavingAlertId] = useState('');
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [healthResponse, alertsResponse, trafficResponse] = await Promise.all([
        fetch(`${API_BASE}/api/health`),
        fetch(`${API_BASE}/api/alerts?limit=100`),
        fetch(`${API_BASE}/api/traffic?limit=100`),
      ]);

      if (!healthResponse.ok) {
        throw new Error('Health check failed');
      }

      const healthData = await healthResponse.json();
      const alertsData = alertsResponse.ok ? await alertsResponse.json() : { alerts: [] };
      const trafficData = trafficResponse.ok ? await trafficResponse.json() : { traffic: [] };

      setHealth(healthData);
      setAlerts(alertsData.alerts || []);
      setTraffic(trafficData.traffic || []);
      setError('');
      setLastUpdated(new Date());
    } catch {
      setError('Backend unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const timer = setInterval(loadDashboard, REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  const counts = useMemo(() => {
    return alerts.reduce(
      (acc, alert) => {
        acc.total += 1;
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        acc[alert.status] = (acc[alert.status] || 0) + 1;
        return acc;
      },
      { total: 0, high: 0, medium: 0, low: 0, open: 0, reviewing: 0, resolved: 0, false_positive: 0 }
    );
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return alerts.filter((alert) => {
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || (alert.status || 'open') === statusFilter;
      const searchable = [
        alert.type,
        alert.source_ip,
        alert.destination_ip,
        alert.classification,
        alert.recommended_action,
        alert.explanation,
        alert.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesSeverity && matchesStatus && (!term || searchable.includes(term));
    });
  }, [alerts, query, severityFilter, statusFilter]);

  const topSources = useMemo(() => {
    const sourceCounts = alerts.reduce((acc, alert) => {
      const source = alert.source_ip || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [alerts]);

  async function updateAlertStatus(alertId, status) {
    setSavingAlertId(alertId);
    try {
      const response = await fetch(`${API_BASE}/api/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Status update failed');
      }
      setAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, status } : alert)));
    } catch {
      setError('Unable to update alert status');
    } finally {
      setSavingAlertId('');
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>IDS-AI</h1>
          <p>Hybrid ML and local LLM intrusion monitoring</p>
        </div>
        <div className="topbar-actions">
          <span className={`health-pill ${error ? 'is-down' : 'is-up'}`}>
            {error || health?.status || (loading ? 'Loading' : 'Unknown')}
          </span>
          <button className="ghost-button" type="button" onClick={loadDashboard}>
            Refresh
          </button>
        </div>
      </header>

      <section className="metric-grid" aria-label="Alert metrics">
        <Metric label="Total alerts" value={counts.total} />
        <Metric label="High severity" value={counts.high} tone="danger" />
        <Metric label="Open" value={counts.open} tone="warning" />
        <Metric label="Traffic events" value={traffic.length} tone="neutral" />
      </section>

      <section className="content-grid">
        <div className="panel system-panel">
          <PanelHeader title="System" meta={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''} />
          <div className="system-list">
            <SystemItem label="ML model" value={health?.ml_model || 'Unavailable'} state={health?.ml_model_loaded} />
            <SystemItem label="LLM" value={`${health?.llm_provider || 'unknown'} / ${health?.llm_model || 'unknown'}`} state={health?.llm_loaded} />
            <SystemItem label="Alert storage" value={health?.alert_storage_connected ? 'Connected' : 'Unavailable'} state={health?.alert_storage_connected} />
            <SystemItem label="Traffic storage" value={health?.traffic_storage_connected ? 'Connected' : 'Unavailable'} state={health?.traffic_storage_connected} />
          </div>
        </div>

        <div className="panel source-panel">
          <PanelHeader title="Top Sources" meta="By alert count" />
          {topSources.length === 0 ? (
            <EmptyState text="No source activity yet." />
          ) : (
            <div className="source-list">
              {topSources.map(([source, count]) => (
                <div className="source-row" key={source}>
                  <span>{source}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="view-toolbar">
          <div className="tabs" role="tablist" aria-label="Dashboard views">
            <button className={activeView === 'alerts' ? 'active' : ''} type="button" onClick={() => setActiveView('alerts')}>
              Alerts
            </button>
            <button className={activeView === 'traffic' ? 'active' : ''} type="button" onClick={() => setActiveView('traffic')}>
              Traffic
            </button>
          </div>

          {activeView === 'alerts' && (
            <div className="filters">
              <input
                aria-label="Search alerts"
                placeholder="Search IP, type, action..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} aria-label="Severity filter">
                <option value="all">All severity</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status filter">
                <option value="all">All status</option>
                <option value="open">Open</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False positive</option>
              </select>
            </div>
          )}
        </div>

        {activeView === 'alerts' ? (
          <AlertsTable alerts={filteredAlerts} savingAlertId={savingAlertId} onStatusChange={updateAlertStatus} />
        ) : (
          <TrafficTable traffic={traffic} />
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, tone = 'default' }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PanelHeader({ title, meta }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      {meta ? <span>{meta}</span> : null}
    </div>
  );
}

function SystemItem({ label, value, state }) {
  return (
    <div className="system-item">
      <span className={`status-dot ${state ? 'ok' : 'bad'}`} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function AlertsTable({ alerts, savingAlertId, onStatusChange }) {
  if (alerts.length === 0) {
    return <EmptyState text="No alerts match the current filters." />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Type</th>
            <th>Source</th>
            <th>Classification</th>
            <th>Confidence</th>
            <th>Evidence</th>
            <th>Explanation</th>
            <th>Recommended action</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td>{formatDate(alert.timestamp)}</td>
              <td>
                <span className={`severity-badge ${alert.severity || 'low'}`}>{alert.severity || 'low'}</span>
              </td>
              <td>
                <select
                  className="status-select"
                  value={alert.status || 'open'}
                  disabled={savingAlertId === alert.id}
                  onChange={(event) => onStatusChange(alert.id, event.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="resolved">Resolved</option>
                  <option value="false_positive">False positive</option>
                </select>
              </td>
              <td>{alert.type || '-'}</td>
              <td>{alert.source_ip || '-'}</td>
              <td>{alert.classification || '-'}</td>
              <td>{formatPercent(alert.final_confidence || alert.ml_confidence || alert.llm_confidence)}</td>
              <td className="evidence-cell">{formatEvidence(alert)}</td>
              <td className="explanation-cell">{alert.explanation || alert.message || '-'}</td>
              <td className="action-cell">{alert.recommended_action || alert.message || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrafficTable({ traffic }) {
  if (traffic.length === 0) {
    return <EmptyState text="No analyzed traffic has been persisted yet." />;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Protocol</th>
            <th>Bytes</th>
            <th>Duration</th>
            <th>Label</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          {traffic.map((record) => (
            <tr key={record.id}>
              <td>{formatDate(record.timestamp)}</td>
              <td>{record.source_ip || '-'}</td>
              <td>{record.destination_ip || '-'}</td>
              <td>{record.protocol || '-'}</td>
              <td>{record.packet_size ?? '-'}</td>
              <td>{typeof record.duration === 'number' ? `${record.duration}s` : '-'}</td>
              <td>{record.label || '-'}</td>
              <td>
                <span className={`severity-badge ${record.severity || 'low'}`}>{record.severity || 'low'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }) {
  return <p className="empty-state">{text}</p>;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function formatPercent(value) {
  if (typeof value !== 'number') return '-';
  return `${Math.round(value * 100)}%`;
}

function formatEvidence(alert) {
  const llmEvidence = Array.isArray(alert.evidence) ? alert.evidence : [];
  const riskSignals = Array.isArray(alert.risk_signals)
    ? alert.risk_signals.map((signal) => signal.evidence || signal.name).filter(Boolean)
    : [];
  const knowledge = Array.isArray(alert.knowledge_matches) ? alert.knowledge_matches : [];
  const items = [...llmEvidence, ...riskSignals, ...knowledge].slice(0, 3);
  return items.length > 0 ? items.join(' | ') : '-';
}

export default App;
