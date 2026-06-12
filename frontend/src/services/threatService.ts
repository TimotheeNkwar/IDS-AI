import api from "../Api/Api";
import type { AxiosResponse } from "axios";
import type { AbuseCheckResponse } from "../types/types";

// services/threatService.ts
export const threatService = {
  // Ta MongoDB — IPs détectées par ton IDS
  getBlacklist: (minConfidence = 0.8, limit = 100) =>
    api.get("/blacklist", { params: { min_confidence: minConfidence, limit } }),

  // AbuseIPDB — vérifier une IP externe
  checkIP: (ip: string) => api.get("/abuse/check", { params: { ip } }),

  // Stats AbuseIPDB
  getStats: () => api.get("/abuse/stats"),
};
