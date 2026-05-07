{
  "timestamp": "2026-05-07T08:45:40.978815Z",
  "ml_label": "xss",
  "ml_confidence": 0.8729,
  "ml_model": "XGBoost",
  "is_anomaly": true,
  "attack_type": "xss",
  "risk_signals": [],
  "top_features": [
    {
      "name": "proto_enc",
      "importance": 0.3258,
      "value": 1
    },
    {
      "name": "conn_state_enc",
      "importance": 0.1022,
      "value": 10
    },
    {
      "name": "service_enc",
      "importance": 0.1014,
      "value": 0
    },
    {
      "name": "src_bytes",
      "importance": 0.0751,
      "value": 102
    },
    {
      "name": "dst_port",
      "importance": 0.0718,
      "value": 80
    }
  ],
  "classification": "Suspicious",
  "llm_attack_type": null,
  "llm_severity": "medium",
  "llm_confidence": 0.87,
  "evidence": [
    "proto=tcp and conn_state=SF (syn-flood)",
    "src_bytes significantly higher than dst_bytes"
  ],
  "knowledge_matches": [
    "CROSS-SITE SCRIPTING (XSS)",
    "Log format and severity reference",
    "PORT SCANNING / NETWORK RECONNAISSANCE",
    "DISTRIBUTED DENIAL OF SERVICE (DDoS)"
  ],
  "explanation": "The log entry shows a high volume of data transfer from the source to destination, which is unusual for typical HTTP requests. This could indicate an attempt at resource exhaustion or denial-of-service.",
  "recommended_action": "Monitor traffic patterns and consider rate limiting or blocking IP 192.168.1.10 if necessary.",
  "needs_manual_review": true,
  "llm_available": true,
  "final_confidence": 0.87,
  "severity": "high",
  "src_ip": "192.168.1.10",
  "dst_ip": "10.0.0.1",
  "proto": "tcp",
  "service": "-"
}