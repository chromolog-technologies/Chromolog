import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../services/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("chromolog_admin_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("chromolog_admin_token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      apiClient
        .get("/admin/auth/me")
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.data.user);
            localStorage.setItem("chromolog_admin_user", JSON.stringify(res.data.data.user));
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token, user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      if (res.data.success) {
        const { user: userData, token: tokenData } = res.data.data;
        setUser(userData);
        setToken(tokenData);
        localStorage.setItem("chromolog_admin_token", tokenData);
        localStorage.setItem("chromolog_admin_user", JSON.stringify(userData));
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, message: res.data.message };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || "Invalid credentials. Please try again.";
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    if (token) {
      apiClient.post("/admin/auth/logout").catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("chromolog_admin_token");
    localStorage.removeItem("chromolog_admin_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
