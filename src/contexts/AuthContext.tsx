"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/service/firebase";

export type MemberData = {
  uid: string;
  firstName: string;
  lastName: string;
  familyId: string;
  isAdmin: boolean;
  isActive: boolean;
  photoURL?: string;
};

type AuthContextType = {
  user: User | null;
  member: MemberData | null;
  loading: boolean;
  refreshMember: () => Promise<void>;
};

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMember(firebaseUser: User) {
    const snap = await getDoc(doc(db, "member", firebaseUser.uid));
    if (snap.exists()) {
      const data = snap.data();
      setMember({
        uid: firebaseUser.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        familyId: data.familyId,
        isAdmin: data.isAdmin === true,
        isActive: data.isActive !== false,
        photoURL: data.photoURL ?? undefined,
      });
    } else {
      setMember(null);
    }
  }

  // Permite que páginas recarreguem o member após upload de foto
  async function refreshMember() {
    if (user) await loadMember(user);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await loadMember(firebaseUser);
        } catch (error) {
          console.error("Erro ao carregar membro:", error);
          setMember(null);
        }
      } else {
        setMember(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, member, loading, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}