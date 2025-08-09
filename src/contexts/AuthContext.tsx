'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';

interface StupidUser extends User {
  isStupid: true;
}

interface AuthContextType {
  user: User | null;
  stupidUser: StupidUser | null;
  mode: 'real' | 'stupid';
  effectiveUser: User | StupidUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stupidUser, setStupidUser] = useState<StupidUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const mode = pathname.startsWith('/stupid') ? 'stupid' : 'real';
  const effectiveUser = mode === 'stupid' ? stupidUser : user;
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const { uid, displayName, email, photoURL } = firebaseUser;
        const realUser = { uid, displayName, email, photoURL };
        setUser(realUser);

        const randomId = Math.floor(1000 + Math.random() * 9000);
        const stupidName = `StupidUser${randomId}`;
        setStupidUser({
            ...realUser,
            displayName: stupidName,
            photoURL: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${stupidName}`,
            isStupid: true,
        });

      } else {
        setUser(null);
        setStupidUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, stupidUser, mode, effectiveUser, loading, signInWithGoogle, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
