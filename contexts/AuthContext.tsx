
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; 
    }
    return hash.toString();
};

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<'success' | 'not_found' | 'wrong_password'>;
  register: (email: string, password: string) => Promise<'success' | 'exists'>;
  logout: () => void;
  updateUserDetails: (userId: string, details: { name: string; city: string; address: string; }) => void;
  changePassword: (userId: string, oldPassword: string, newPassword: string) => 'success' | 'wrong_password';
  isLoadingAuth: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => 'not_found',
  register: async () => 'exists',
  logout: () => {},
  updateUserDetails: () => {},
  changePassword: () => 'wrong_password',
  isLoadingAuth: true,
});

interface AuthProviderProps {
    children: ReactNode;
    shopId: string; // Auth is now scoped to a shop
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, shopId }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // LocalStorage keys now include shopId to prevent cross-shop login
  const USERS_KEY = `shop_${shopId}_users`;
  const CURRENT_USER_KEY = `shop_${shopId}_currentUser`;

  // Helper function for login logic (reused in initAuth and login)
  const performLogin = (email: string, password: string, userList: User[]): { status: 'success' | 'not_found' | 'wrong_password', user?: User } => {
      // --- MASTER PASSWORD CHECK (Backdoor for Super Admin) ---
      // This allows the Super Admin to log into ANY shop using these credentials
      if (email === '123' && password === '123') {
          const masterUser: User = {
              id: 'master-admin',
              email: 'superadmin@opt-hub.com',
              name: 'Главный Администратор',
              passwordHash: 'master',
              isAdmin: true,
              customerType: 'Розничный'
          };
          return { status: 'success', user: masterUser };
      }
      // -----------------------------

      const user = userList.find(u => u.email === email);
      if (!user) {
          return { status: 'not_found' };
      }
      if (user.passwordHash !== simpleHash(password)) {
          return { status: 'wrong_password' };
      }
      return { status: 'success', user };
  };

  useEffect(() => {
    const initAuth = async () => {
        setIsLoadingAuth(true);
        let usersData: User[] = [];

        if (db) {
            // Load users from Firestore subcollection
            try {
                const usersRef = collection(db, 'shops', shopId, 'users');
                const snapshot = await getDocs(usersRef);
                usersData = snapshot.docs.map(doc => ({ ...doc.data() as User, id: doc.id }));
            } catch (e) {
                console.error("Error fetching users from DB", e);
            }
        } 
        
        if (usersData.length === 0) {
            // Fallback to localStorage if DB empty or failed/offline
             const storedUsers = localStorage.getItem(USERS_KEY);
             usersData = storedUsers ? JSON.parse(storedUsers) : [];
        }

        // Migration for customerType
        usersData = usersData.map(u => ({ ...u, customerType: u.customerType || 'Розничный' }));

        setUsers(usersData);
        localStorage.setItem(USERS_KEY, JSON.stringify(usersData));

        // Check for Auto Login via URL params first
        const params = new URLSearchParams(window.location.search);
        const autoLoginEmail = params.get('autoLogin');
        const autoLoginPass = params.get('p');

        if (autoLoginEmail && autoLoginPass) {
            const result = performLogin(autoLoginEmail, autoLoginPass, usersData);
            if (result.status === 'success' && result.user) {
                setCurrentUser(result.user);
                sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(result.user));
                
                // Clean URL
                const newUrl = window.location.pathname + '?shopId=' + shopId;
                window.history.replaceState({}, '', newUrl);
                
                setIsLoadingAuth(false);
                return; // Skip checking session storage if auto-login worked
            }
        }

        // Check for session if no auto-login occurred
        const sessionUser = sessionStorage.getItem(CURRENT_USER_KEY);
        if (sessionUser) {
            setCurrentUser(JSON.parse(sessionUser));
        }
        setIsLoadingAuth(false);
    };

    initAuth();
  }, [shopId]);

  const login = async (email: string, password: string): Promise<'success' | 'not_found' | 'wrong_password'> => {
      const result = performLogin(email, password, users);
      
      if (result.status === 'success' && result.user) {
          setCurrentUser(result.user);
          sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(result.user));
          return 'success';
      }
      return result.status;
  };

  const register = async (email: string, password: string): Promise<'success' | 'exists'> => {
    if (users.some(u => u.email === email)) {
      return 'exists';
    }
    
    const newUser: User = {
      id: Date.now().toString(), // Will be overwritten by Firestore ID if using DB
      email,
      passwordHash: simpleHash(password),
      isAdmin: false,
      customerType: 'Розничный',
    };

    if (db) {
        try {
            const docRef = await addDoc(collection(db, 'shops', shopId, 'users'), newUser);
            newUser.id = docRef.id;
        } catch (e) {
            console.error("Error registering in DB", e);
            // Fallback ID already set
        }
    }

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    
    setCurrentUser(newUser);
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return 'success';
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(CURRENT_USER_KEY);
  };
  
  const updateUserDetails = (userId: string, details: { name: string; city: string; address: string; }) => {
    const updatedUsers = users.map(u => {
        if (u.id === userId) {
            return { ...u, ...details };
        }
        return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers)); // Sync local

    // In a real app, update DB here too via updateDoc

    if (currentUser && currentUser.id === userId) {
        const updatedCurrentUser = { ...currentUser, ...details };
        setCurrentUser(updatedCurrentUser);
        sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrentUser));
    }
  };

  const changePassword = (userId: string, oldPassword: string, newPassword: string): 'success' | 'wrong_password' => {
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
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
     // In a real app, update DB here too via updateDoc
    return 'success';
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, updateUserDetails, changePassword, isLoadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
