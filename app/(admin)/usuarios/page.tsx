"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Plus, Edit, Trash2, ChevronDown } from "lucide-react";
import { UserProfile, UserRole } from "@/types";
import toast from "react-hot-toast";

function UserListItem({
  user,
  onEdit,
  onDelete,
}: {
  user: UserProfile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const roleColor = {
    MASTER: "bg-purple-200 text-purple-800",
    ADMIN: "bg-blue-200 text-blue-800",
    USER: "bg-green-200 text-green-800",
  };
  return (
    <div className="bg-slate-50 rounded-lg">
      <div className="hidden sm:grid grid-cols-12 gap-4 items-center p-3">
        <div className="col-span-3 font-semibold text-gray-800">
          {user.nome}
        </div>
        <div className="col-span-4 text-gray-600">{user.email}</div>
        <div className="col-span-2 text-gray-600">{user.whatsapp}</div>
        <div className="col-span-2">
          <span
            className={`px-2 py-1 text-xs font-bold rounded-full ${
              roleColor[user.role]
            }`}
          >
            {user.role}
          </span>
        </div>
        <div className="col-span-1 flex items-center justify-end space-x-3">
          <button
            onClick={onEdit}
            className="text-gray-500 hover:text-teal-600"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-500 hover:text-red-600"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      <div className="sm:hidden">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full flex items-center justify-between p-3 text-left"
        >
          <div>
            <span className="font-semibold text-gray-800">{user.nome}</span>
            <p
              className={`text-sm font-medium ${
                roleColor[user.role]
              } bg-opacity-40 rounded-full inline-block px-2 mt-1`}
            >
              {user.role}
            </p>
          </div>
          <ChevronDown
            size={20}
            className={`transition-transform ${
              isMobileOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {isMobileOpen && (
          <div className="p-4 border-t border-slate-200 space-y-3">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p>{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Whatsapp</p>
              <p>{user.whatsapp}</p>
            </div>
            <div className="flex justify-end space-x-4 pt-2">
              <button
                onClick={onEdit}
                className="flex items-center text-sm p-2 rounded-md bg-slate-200 hover:bg-slate-300"
              >
                <Edit size={16} className="mr-1" /> Editar
              </button>
              <button
                onClick={onDelete}
                className="flex items-center text-sm p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
              >
                <Trash2 size={16} className="mr-1" /> Excluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [formState, setFormState] = useState({
    uid: "",
    nome: "",
    email: "",
    whatsapp: "",
    senha: "",
    role: "USER" as UserRole,
    dailyConferenceGoal: 2,
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const usersCollection = collection(db, "users");
      const usersQuery = query(usersCollection, orderBy("nome"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(
        (doc) => ({ uid: doc.id, ...doc.data() } as UserProfile)
      );
      setUsers(usersList);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Não foi possível carregar os usuários.", {
        id: "global-toast",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userProfile && userProfile.role === "MASTER") {
      fetchUsers();
    }
  }, [userProfile, fetchUsers]);

  if (userProfile && userProfile.role !== "MASTER") {
    router.replace("/dashboard");
    return null;
  }

  const openAddModal = () => {
    setCurrentUser(null);
    setFormState({
      uid: "",
      nome: "",
      email: "",
      whatsapp: "",
      senha: "",
      role: "USER",
      dailyConferenceGoal: 2,
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    setCurrentUser(user);
    setFormState({
      ...user,
      senha: "",
      dailyConferenceGoal: user.dailyConferenceGoal || 2,
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (user: UserProfile) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { senha, uid, ...profileData } = formState;
        await setDoc(userRef, profileData, { merge: true });
        toast.success(`Usuário "${formState.nome}" atualizado com sucesso!`, {
          id: "global-toast",
        });
        fetchUsers();
        setIsFormModalOpen(false);
      } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        toast.error("Não foi possível atualizar o usuário.", {
          id: "global-toast",
        });
      }
    } else {
      if (!formState.email || !formState.senha) {
        toast.error(
          "Email e Senha são obrigatórios para criar um novo usuário.",
          { id: "global-toast" }
        );
        return;
      }
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        toast.success(result.message, { id: "global-toast" });
        fetchUsers();
        setIsFormModalOpen(false);
      } catch (error) {
        console.error("Erro ao criar usuário:", error);
        toast.error(
          `Erro: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
          { id: "global-toast" }
        );
      }
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/users?uid=${userToDelete.uid}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      toast.success(result.message, { id: "global-toast" });
      fetchUsers();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      toast.error(
        `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { id: "global-toast" }
      );
    }
  };

  const modalTitle = currentUser ? "Editar Usuário" : "Adicionar Novo Usuário";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Usuários</h1>
        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">Adicionar Usuários</span>
          <span className="sm:hidden">Usuários</span>
        </button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">
            Carregando usuários...
          </p>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-4 p-3 text-sm font-bold text-slate-500 border-b">
              <div className="col-span-3">Nome</div>
              <div className="col-span-4">Email</div>
              <div className="col-span-2">Whatsapp</div>
              <div className="col-span-2">Perfil</div>
              <div className="col-span-1 text-right">Ações</div>
            </div>
            <div className="space-y-2 mt-2">
              {users.map((user) => (
                <UserListItem
                  key={user.uid}
                  user={user}
                  onEdit={() => openEditModal(user)}
                  onDelete={() => openDeleteModal(user)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={modalTitle}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              name="nome"
              value={formState.nome}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Whatsapp
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formState.whatsapp}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              name="senha"
              value={formState.senha}
              onChange={handleFormChange}
              placeholder={
                currentUser ? "Deixe em branco para não alterar" : ""
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Perfil
            </label>
            <select
              name="role"
              value={formState.role}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="USER">Técnico (USER)</option>
              <option value="ADMIN">Administrador (ADMIN)</option>
              <option value="MASTER">Master (MASTER)</option>
            </select>
          </div>
          {formState.role === "USER" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Meta de Conferências Diárias
              </label>
              <input
                type="number"
                name="dailyConferenceGoal"
                value={formState.dailyConferenceGoal}
                onChange={handleFormChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o usuário "${userToDelete?.nome}"? Esta ação é irreversível.`}
      />
    </div>
  );
}
