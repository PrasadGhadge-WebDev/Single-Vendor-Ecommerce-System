import React, { createContext, useEffect, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("userInfo");
    const storedToken = sessionStorage.getItem("token");
    if (storedUser && storedToken) {
      return JSON.parse(storedUser);
    }
    return null;
  });

  useEffect(() => {
    // Clear legacy persistent auth keys so app does not auto-login from old localStorage data.
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
  }, []);

  const login = (userData) => {
    sessionStorage.setItem("userInfo", JSON.stringify(userData));
    sessionStorage.setItem("token", userData.token);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("userInfo");
    sessionStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (nextUserData) => {
    if (!nextUserData) return;
    const currentToken = sessionStorage.getItem("token") || user?.token;
    const merged = { ...user, ...nextUserData, token: currentToken };
    sessionStorage.setItem("userInfo", JSON.stringify(merged));
    if (currentToken) {
      sessionStorage.setItem("token", currentToken);
    }
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
