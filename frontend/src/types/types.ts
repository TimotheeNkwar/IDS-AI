export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RiskSignal {
  name: string;
  severity: string;
  evidence: string;
}

export interface TopFeature {
  name: string;
  importance: number;
  value: number;
}

export interface TrafficRecord {
  id: string;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  service: string;
  packet_size: number;
  duration: number;
  label: string;
  is_anomaly: boolean;
  ml_confidence: number;
  severity: "low" | "medium" | "high";
  risk_signals: RiskSignal[];
  top_features: TopFeature[];
  knowledge_matches: string[];
  raw_event?: Record<string, unknown>;

  // ── New fields ──────────────────────
  explanation?: string;
  recommended_action?: string;
  evidence?: string[];
  classification?: string;
  needs_review?: boolean;
  ml_model?: string;
  llm_severity?: string;
  llm_confidence?: number;
  final_confidence?: number;
}

export interface TrafficResponse {
  traffic: TrafficRecord[];
  storage_available: boolean;
}

// ── WebSocket ──────────────────────────────────────────────────

export interface WsMeta {
  protocol: string;
  service: string;
  src_ip: string;
  dst_ip: string;
}

export interface WsAlert {
  src_ip: string;
  dst_ip: string;

  classification: string;
  severity: "low" | "medium" | "high";
  attack_type: string | null;
  confidence: number;
  explanation: string;
  recommended_action: string;
  needs_review: boolean;
  // Classification details
  ml_label: string;
  ml_confidence: number;
  ml_model: string;
  llm_severity: string | null;
  llm_confidence: number;
  risk_signals: RiskSignal[];
  top_features: TopFeature[];
  evidence: string[];
  knowledge_matches: string[];
  protocol: string;
  service: string;
}

export interface WsDashboardUpdate {
  type: "dashboard_update";
  timestamp: string;
  is_anomaly: boolean;
  meta: WsMeta;
  alert: WsAlert | null;
}

// ── Feed alertes ───────────────────────────────────────────────

export interface AlertFeedItem {
  id: string;
  timestamp: string;
  label: string;
  severity: "low" | "medium" | "high";
  source_ip: string;
  destination_ip: string;
  protocol: string;
  ml_confidence: number;
  is_anomaly: boolean;
  risk_signals: RiskSignal[];
  top_features: TopFeature[];
}
