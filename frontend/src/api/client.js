/**
 * Axios client configured with JWT auth interceptor.
 */

import axios from "axios";
import useAppStore from "../store/appStore";

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
    headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
    const token = useAppStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 — auto logout
client.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            useAppStore.getState().logout();
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

// === Auth API ===
export const authAPI = {
    register: (data) => client.post("/auth/register", data),
    login: (data) => client.post("/auth/login", data),
    me: () => client.get("/auth/me"),
};

// === Repo API ===
export const repoAPI = {
    analyze: (data) => client.post("/repos/analyze", data),
    list: () => client.get("/repos/"),
    get: (id) => client.get(`/repos/${id}`),
    reset: (id) => client.post(`/repos/${id}/reset`),
    delete: (id) => client.delete(`/repos/${id}`),
};

// === File API ===
export const fileAPI = {
    list: (repoId) => client.get(`/files/repo/${repoId}`),
    tree: (repoId) => client.get(`/files/repo/${repoId}/tree`),
    detail: (fileId) => client.get(`/files/${fileId}`),
};

// === Notebook API ===
export const notebookAPI = {
    get: (fileId) => client.get(`/notebooks/${fileId}`),
    chat: (fileId, message) => client.post(`/notebooks/${fileId}/chat`, { message }),
    updateNotes: (fileId, notes) => client.put(`/notebooks/${fileId}/notes`, { user_notes: notes }),
};

export default client;
