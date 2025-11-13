import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

// A simple hashing function for demonstration. 
// In a real app, use a robust library like bcrypt.
const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
};

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => 'success' | 'not_found' | 'wrong_password';
  register: (email: string, password: string) => 'success' | 'exists';
  logout: () => void;
  updateUserDetails: (userId: number, details: { name: string; city: string; address: string; }) => void;
  changePassword: (userId: number, oldPassword: string, newPassword: string) => 'success' | 'wrong_password';
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => 'not_found',
  register: () => 'exists',
  logout: () => {},
  updateUserDetails: () => {},
  changePassword: () => 'wrong_password',
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load users from localStorage and ensure admin exists
    const storedUsers = localStorage.getItem('users');
    let usersData: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    // Migration for customerType
    usersData = usersData.map(u => ({ ...u, customerType: u.customerType || 'Розничный' }));

    // Clean up old admin user
    usersData = usersData.filter(u => u.email !== 'admin@cheese.com');

    const adminLogin = '1';
    const adminExists = usersData.some(u => u.email === adminLogin);

    if (!adminExists) {
        const adminUser: User = {
            id: Date.now(),
            email: adminLogin,
            passwordHash: simpleHash('1'),
            isAdmin: true,
            customerType: 'Розничный',
        };
        usersData.push(adminUser);
    }
    localStorage.setItem('users', JSON.stringify(usersData));
    setUsers(usersData);

    // Check for a logged-in user in sessionStorage
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      setCurrentUser(JSON.parse(sessionUser));
    }
  }, []);

  const login = (email: string, password: string): 'success' | 'not_found' | 'wrong_password' => {
    const user = users.find(u => u.email === email);
    if (!user) {
      return 'not_found';
    }
    if (user.passwordHash !== simpleHash(password)) {
      return 'wrong_password';
    }
    setCurrentUser(user);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    return 'success';
  };

  const register = (email: string, password: string): 'success' | 'exists' => {
    if (users.some(u => u.email === email)) {
      return 'exists';
    }
    const newUser: User = {
      id: Date.now(),
      email,
      passwordHash: simpleHash(password),
      isAdmin: false, // Regular users are not admins
      customerType: 'Розничный',
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Automatically log in after registration
    setCurrentUser(newUser);
    sessionStorage.setItem('currentUser', JSON.stringify(newUser));
    return 'success';
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
  };
  
  const updateUserDetails = (userId: number, details: { name: string; city: string; address: string; }) => {
    const updatedUsers = users.map(u => {
        if (u.id === userId) {
            return { ...u, ...details };
        }
        return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    if (currentUser && currentUser.id === userId) {
        const updatedCurrentUser = { ...currentUser, ...details };
        setCurrentUser(updatedCurrentUser);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
    }
  };

  const changePassword = (userId: number, oldPassword: string, newPassword: string): 'success' | 'wrong_password' => {
    const user = users.find(u => u.id === userId);
    if (!user || user.passwordHash !== simpleHash(oldPassword)) {
        return 'wrong_password';
    }

    const updatedUsers = users.map(u => {
        if (u.id === userId) {
            return { ...u, passwordHash: simpleHash(newPassword) };
        }
        return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    return 'success';
  };


  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, updateUserDetails, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};