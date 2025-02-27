// File: src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
          const res = await api.get("/api/users/profile");
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
          setIsAuthenticated(false);
          setUser(null);
        }
      }

      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      const res = await api.post("/api/users", userData);

      localStorage.setItem("token", res.data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

      setUser(res.data);
      setIsAuthenticated(true);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response.data.message,
      };
    }
  };

  // Login user
  const login = async (userData) => {
    try {
      const res = await api.post("/api/users/login", userData);

      localStorage.setItem("token", res.data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

      setUser(res.data);
      setIsAuthenticated(true);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response.data.message,
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update profile
  const updateProfile = async (userData) => {
    try {
      const res = await api.put("/api/users/profile", userData);

      if (userData.password) {
        // If password was updated, update the token
        localStorage.setItem("token", res.data.token);
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${res.data.token}`;
      }

      setUser(res.data);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response.data.message,
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
