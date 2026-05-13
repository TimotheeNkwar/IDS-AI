import api from "../Api/Api";
import type { AxiosResponse } from "axios";
import type { TrafficRecord, TrafficResponse } from "../types/types";

export const trafficService = {
  fetchTrafficData: (): Promise<AxiosResponse<TrafficResponse>> =>
    api.get("/traffic"),

  fetchTrafficRecord: (id: string): Promise<AxiosResponse<TrafficRecord>> =>
    api.get(`/traffic/${id}`),
};
