// services/alertService.ts
import api from "../Api/Api";
import type { AxiosResponse } from "axios";
import type { Alert, AlertResponse, AlertFilters } from "../types/types";

export const alertService = {
  fetchAlerts: (
    filters?: AlertFilters,
  ): Promise<AxiosResponse<AlertResponse>> =>
    api.get("/alerts", { params: filters }),

  fetchAlert: (id: string): Promise<AxiosResponse<Alert>> =>
    api.get(`/alerts/${id}`),

  updateStatus: (
    id: string,
    status: Alert["status"],
  ): Promise<AxiosResponse<Alert>> =>
    api.patch(`/alerts/${id}/status`, { status }),

  markReviewed: (id: string): Promise<AxiosResponse<Alert>> =>
    api.patch(`/alerts/${id}/review`),
};
