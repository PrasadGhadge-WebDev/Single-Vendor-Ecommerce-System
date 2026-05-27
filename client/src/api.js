import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response.data?.message || "";
      if (msg.includes("token") || msg.includes("authorized")) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userInfo");
        // Optionally redirect to login if not already there
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login?expired=true";
        }
      }
    }
    return Promise.reject(error);
  }
);

const apiOrigin = baseURL.replace(/\/api\/?$/, "");
export const uploadURL = `${apiOrigin}/uploads`;

export const getImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^data:/i.test(value)) return value;
  if (/^blob:/i.test(value)) return value;

  let normalized = String(value).trim();
  normalized = normalized.replace(/\\/g, "/");
  normalized = normalized.replace(/^\.\//, "");
  normalized = normalized.replace(/^\/+/, "");
  normalized = normalized.replace(/^uploads\//i, "");

  return `${uploadURL}/${encodeURI(normalized)}`;
};

export default API;
