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
import { getOrCreateUser } from '@/app/auth/actions';


interface StupidUser extends User {
  isStupid: true;
}

interface AuthContextType {
  user: User | null;
  stupidUser: StupidUser | null;
  mode: 'real' | 'stupid' | 'none';
  effectiveUser: User | StupidUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

function getMode(pathname: string): 'real' | 'stupid' | 'none' {
    if (pathname.startsWith('/stupid')) {
        return 'stupid';
    }
    if (pathname.startsWith('/real') || pathname === '/') {
        return 'real';
    }
    return 'none';
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stupidUser, setStupidUser] = useState<StupidUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const mode = getMode(pathname);
  const effectiveUser = mode === 'stupid' ? stupidUser : user;
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const { uid, displayName, email, photoURL } = firebaseUser;

        try {
          await getOrCreateUser(uid, displayName, email, photoURL);
        } catch (error) {
            console.error("Failed to get or create user", error)
            // sign out the user if we can't create a DB record
            await signOutUser();
            return;
        }
        
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
