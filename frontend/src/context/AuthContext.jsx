import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');

      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      // Dữ liệu đăng nhập đã lưu bị hỏng -> coi như chưa đăng nhập
      return null;
    }
  });

  // Lưu thông tin sau khi đăng nhập thành công
  const loginUser = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
  };

  // Đăng xuất
  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginUser,
        logoutUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}