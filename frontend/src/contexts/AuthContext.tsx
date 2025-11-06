// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { User, authAPI } from '@/lib/api';

// interface AuthContextType {
//   user: User | null;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   signup: (username: string, email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Check for existing session
//     const savedUser = localStorage.getItem('user');
//     if (savedUser) {
//       try {
//         setUser(JSON.parse(savedUser));
//       } catch (error) {
//         localStorage.removeItem('user');
//       }
//     }
//     setIsLoading(false);
//   }, []);

//   const login = async (email: string, password: string) => {
//     setIsLoading(true);
//     try {
//       const userData = await authAPI.login(email, password);
//       setUser(userData);
//       localStorage.setItem('user', JSON.stringify(userData));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const signup = async (username: string, email: string, password: string) => {
//     setIsLoading(true);
//     try {
//       const userData = await authAPI.signup(username, email, password);
//       setUser(userData);
//       localStorage.setItem('user', JSON.stringify(userData));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = async () => {
//     setIsLoading(true);
//     try {
//       await authAPI.logout();
//       setUser(null);
//       localStorage.removeItem('user');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const value = {
//     user,
//     isLoading,
//     login,
//     signup,
//     logout
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };