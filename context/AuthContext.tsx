"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null; // <-- PROPRIEDADE ADICIONADA AQUI
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  authError: null, // <-- VALOR PADRÃO ADICIONADO AQUI
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setAuthError(null);
      if (currentUser) {
        setUser(currentUser);
        // Sincroniza o login com o servidor para criar o cookie de sessão
        const idToken = await currentUser.getIdToken();
        fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile({
              uid: currentUser.uid,
              ...userDocSnap.data(),
            } as UserProfile);
          } else {
            setAuthError("Seu perfil de usuário não foi encontrado.");
            await auth.signOut();
          }
        } catch (error) {
          console.error("Erro ao buscar perfil do usuário:", error);
          setAuthError(
            "Falha ao conectar com o banco de dados. Verifique seu firewall ou restrições de rede."
          );
          await auth.signOut();
        }
      } else {
        setUser(null);
        setUserProfile(null);
        fetch("/api/auth", { method: "DELETE" });
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
