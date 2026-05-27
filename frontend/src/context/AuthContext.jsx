import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is in localStorage to simulate persistence
    const storedUser = localStorage.getItem('justicia_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          const mockUser = {
            id: 1,
            name: 'Luz Esmeralda',
            email: email,
            role: email.includes('admin') ? 'admin' : 'user',
            avatar: 'LE'
          };
          setUser(mockUser);
          localStorage.setItem('justicia_user', JSON.stringify(mockUser));
          resolve(mockUser);
        } else {
          reject(new Error('Credenciales inválidas'));
        }
      }, 1000);
    });
  };

  const register = async (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser = {
          id: Date.now(),
          name: userData.nombre + ' ' + userData.apellido,
          email: userData.correo,
          role: 'user',
          avatar: userData.nombre.charAt(0) + userData.apellido.charAt(0)
        };
        setUser(mockUser);
        localStorage.setItem('justicia_user', JSON.stringify(mockUser));
        resolve(mockUser);
      }, 1500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('justicia_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
