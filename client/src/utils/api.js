// File: src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to headers if available
if (localStorage.token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${localStorage.token}`;
}

export default api;
