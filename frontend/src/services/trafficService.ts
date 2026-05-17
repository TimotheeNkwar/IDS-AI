import api from "../Api/Api";
import type { AxiosResponse } from "axios";
import type { TrafficRecord, TrafficResponse } from "../types/types";

export const trafficService = {
  fetchTrafficData: (
    hours: number = 24,
  ): Promise<AxiosResponse<TrafficResponse>> =>
    api.get("/traffic", { params: { hours } }),

  fetchTrafficRecord: (id: string): Promise<AxiosResponse<TrafficRecord>> =>
    api.get(`/traffic/${id}`),
};
