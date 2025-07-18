// context/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { UserProfile } from "@/types";

// Define a interface para os valores do contexto
interface AuthContextType {
  user: User | null; // Objeto de autenticação do Firebase
  userProfile: UserProfile | null; // Nosso perfil customizado do Firestore
  loading: boolean;
}

// Cria o contexto com um valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

// Componente Provedor que envolverá nossa aplicação
export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Usuário está logado, busca o perfil no Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        } else {
          // Caso o perfil não exista no Firestore, desloga para evitar estado inconsistente
          console.error("Perfil do usuário não encontrado no Firestore.");
          auth.signOut();
        }
        setUser(currentUser);
      } else {
        // Usuário está deslogado
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Limpa a inscrição ao desmontar o componente
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto mais facilmente
export const useAuth = () => useContext(AuthContext);
