import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  location?: string;
  isDemoAccount?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, location?: string) => Promise<boolean>;
  loginAsDemo: () => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  
  async function login(email: string, password: string): Promise<boolean> {
    try {
      
      
      const mockUser = {
        id: '1',
        email,
        name: email.split('@')[0], 
        location: 'Global' 
      };
      
      setCurrentUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async function loginAsDemo(): Promise<boolean> {
    try {
      
      const demoUser = {
        id: 'demo-123',
        email: 'demo@inclusivebanking.org',
        name: 'Demo User',
        location: 'Demo Region',
        isDemoAccount: true
      };
      
      setCurrentUser(demoUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(demoUser));
      localStorage.setItem('is_demo_account', 'true');
      return true;
    } catch (error) {
      console.error('Demo login error:', error);
      return false;
    }
  }

  async function register(name: string, email: string, password: string, location: string = 'Global'): Promise<boolean> {
    try {
      
      
      const mockUser = {
        id: '1',
        email,
        name,
        location
      };
      
      setCurrentUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }

  function logout() {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('is_demo_account');
  }

  
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const value = {
    currentUser,
    login,
    register,
    loginAsDemo,
    logout,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 