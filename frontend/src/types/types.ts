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
  source_port?: number;
  destination_port?: number;
}

export interface TrafficResponse {
  traffic: TrafficRecord[];
  storage_available: boolean;
}

export interface AlertResponse {
  alerts: Alert[];
  total: number;
  page: number;
  limit: number;
}

export interface AlertFilters {
  hours?: number;
  limit?: number;
  severity?: "low" | "medium" | "high";
  status?: "open" | "reviewing" | "resolved" | "false_positive";
  attack_type?: string;
}

// ── WebSocket ──────────────────────────────────────────────────

export interface WsMeta {
  protocol: string;
  service: string;
  src_ip: string;
  dst_ip: string;
}

export interface Alert {
  // ── Rest side ──────
  id?: string;
  status?: "open" | "resolved" | "ignored";

  // ── common ────────────────────────────
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  service: string;
  type: string;
  classification: string;
  severity: "low" | "medium" | "high" | "critical";
  ml_label: string;
  ml_confidence: number;
  ml_model?: string;
  llm_severity: string | null;
  llm_confidence: number;
  llm_attack_type: string | null;
  final_confidence: number;
  message?: string;
  explanation?: string;
  evidence: string[];
  recommended_action: string;
  needs_manual_review: boolean;
  risk_signals: RiskSignal[];
  top_features: TopFeature[];
  knowledge_matches: string[];
  source_port: number;
  destination_port: number;
}

// ── WebSocket payloads ─────────────────────────────────────────
export type WsAlert = Alert;

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
  source_port: number;
  destination_port: number;
}

// types/types.ts

export interface Suggestion {
  id: string;
  type: string; // "xss", "mitm", "password"
  priority: "high" | "medium" | "low" | "critical";
  title: string;
  description: string | null;
  recommended_action: string;
  evidence: string[];
  knowledge_matches: string[];
  source_ip: string;
  timestamp: string;
  needs_manual_review: boolean;
  count: number;
}

export type Theme = "dark" | "light" | "system";
