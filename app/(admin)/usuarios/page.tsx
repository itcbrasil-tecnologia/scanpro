"use client";

import React, { useState, useEffect, useCallback, Fragment } from "react";
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
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { UserProfile, UserRole } from "@/types";
import toast from "react-hot-toast";
import { Field, Label, Input, Listbox, Transition } from "@headlessui/react";
import { NumberInput } from "@/components/ui/NumberInput";
import { AppButton } from "@/components/ui/AppButton";
import { TabelaUsuarios } from "@/components/ui/TabelaUsuarios"; // ADICIONADO

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

  const userRoles: { value: UserRole; label: string }[] = [
    { value: "USER", label: "Técnico (USER)" },
    { value: "ADMIN", label: "Administrador (ADMIN)" },
    { value: "MASTER", label: "Master (MASTER)" },
  ];

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

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: UserRole) => {
    setFormState((prev) => ({ ...prev, role: value }));
  };

  const handleGoalChange = (value: number) => {
    setFormState((prev) => ({ ...prev, dailyConferenceGoal: value }));
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
        <AppButton onClick={openAddModal} className="mt-4 sm:mt-0">
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">Adicionar Usuário</span>
          <span className="sm:hidden">Usuário</span>
        </AppButton>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        {isLoading ? (
          <p className="text-center text-gray-500 py-8">
            Carregando usuários...
          </p>
        ) : (
          <TabelaUsuarios
            data={users}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={modalTitle}
      >
        <div className="space-y-4">
          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Nome
            </Label>
            <Input
              type="text"
              name="nome"
              value={formState.nome}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </Field>
          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </Field>
          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Whatsapp
            </Label>
            <Input
              type="tel"
              name="whatsapp"
              value={formState.whatsapp}
              onChange={handleFormChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </Field>
          <Field>
            <Label className="block text-sm font-medium text-gray-700">
              Senha
            </Label>
            <Input
              type="password"
              name="senha"
              value={formState.senha}
              onChange={handleFormChange}
              placeholder={
                currentUser ? "Deixe em branco para não alterar" : ""
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </Field>

          <Listbox value={formState.role} onChange={handleRoleChange}>
            <div className="relative">
              <Listbox.Label className="block text-sm font-medium text-gray-700">
                Perfil
              </Listbox.Label>
              <Listbox.Button className="relative mt-1 w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-white">
                <span className="block truncate">
                  {userRoles.find((r) => r.value === formState.role)?.label}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown className="h-5 w-5 text-gray-400" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  {userRoles.map((role) => (
                    <Listbox.Option
                      key={role.value}
                      value={role.value}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-teal-100" : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {role.label}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                              <Check className="h-5 w-5" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>

          {formState.role === "USER" && (
            <Field>
              <Label className="block text-sm font-medium text-gray-700">
                Meta de Conferências Diárias
              </Label>
              <div className="mt-1">
                <NumberInput
                  value={formState.dailyConferenceGoal}
                  onChange={handleGoalChange}
                />
              </div>
            </Field>
          )}

          <div className="flex justify-end pt-4">
            <AppButton onClick={handleSave}>Salvar</AppButton>
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
