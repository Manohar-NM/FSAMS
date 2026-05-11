import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {

    const storedUser = localStorage.getItem("fsams_user");

    return storedUser ? JSON.parse(storedUser) : null;

  });

  const login = async (credentials) => {

    try {

      const { data } = await api.post("/auth/login", credentials);

      localStorage.setItem("fsams_token", data.token);

      localStorage.setItem(
        "fsams_user",
        JSON.stringify(data.user)
      );

      setUser(data.user);

      return data.user;

    } catch (error) {

      console.error("Login failed:", error);

      throw error;

    }

  };

  const logout = () => {

    localStorage.removeItem("fsams_token");

    localStorage.removeItem("fsams_user");

    setUser(null);

  };

  const value = useMemo(() => ({
    user,
    login,
    logout,
    setUser,
  }), [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }

  return context;

};