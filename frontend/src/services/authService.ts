import api from "../Api/Api";

export const userService = {
  getUsers: () => api.get("/users"),
  getUser: (id: string) => api.get(`/users/${id}`),
  // updateUser: (id: string, data) => api.put(`/users/${id}`, data),
};
