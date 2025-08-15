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

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null; // NOVO ESTADO DE ERRO
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  authError: null, // VALOR INICIAL
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null); // NOVO ESTADO DE ERRO

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthError(null); // Limpa o erro a cada nova verificação
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const profileData = {
              uid: currentUser.uid,
              ...userDocSnap.data(),
            } as UserProfile;
            setUserProfile(profileData);
          } else {
            console.error(
              "Perfil do usuário não encontrado no Firestore. Desconectando."
            );
            setAuthError("Seu perfil de usuário não foi encontrado.");
            await auth.signOut();
          }
        } catch (error) {
          console.error("Erro ao buscar perfil do usuário:", error);
          setAuthError(
            "Falha ao conectar com o banco de dados. Verifique seu firewall ou restrições de rede."
          );
          setUserProfile(null);
          await auth.signOut();
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
