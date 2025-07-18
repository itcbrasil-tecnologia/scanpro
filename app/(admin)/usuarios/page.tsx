// app/(admin)/usuarios/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Plus, Edit, Trash2, ChevronDown } from "lucide-react";
import { UserProfile, UserRole } from "@/types";

// --- Dados Estáticos (Mock) ---
const mockUsers: UserProfile[] = [
  {
    uid: "master1",
    nome: "Admin Master",
    email: "master@scanpro.com",
    whatsapp: "(61) 98888-0001",
    role: "MASTER",
  },
  {
    uid: "admin1",
    nome: "Admin Gestor",
    email: "admin@scanpro.com",
    whatsapp: "(61) 98888-0002",
    role: "ADMIN",
  },
  {
    uid: "user1",
    nome: "João Marcos",
    email: "joao.marcos@tecnico.com",
    whatsapp: "(61) 98888-0003",
    role: "USER",
  },
  {
    uid: "user2",
    nome: "Lucas Veras",
    email: "lucas.veras@tecnico.com",
    whatsapp: "(61) 98888-0004",
    role: "USER",
  },
];
// --- Fim dos Dados Estáticos ---

// Componente para o item da lista, adaptável para mobile conforme o escopo
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
    <div className="bg-gray-50 rounded-lg">
      {/* Visão Desktop: Tabela */}
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
            className="text-gray-500 hover:text-indigo-600"
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

      {/* Visão Mobile: Dropdown */}
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
          <div className="p-4 border-t border-gray-200 space-y-3">
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
                className="flex items-center text-sm p-2 rounded-md bg-gray-200 hover:bg-gray-300"
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

  const [users] = useState<UserProfile[]>(mockUsers);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Estado do formulário
  const [formState, setFormState] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    senha: "",
    role: "USER" as UserRole,
  });

  // Acesso exclusivo para MASTER
  if (userProfile && userProfile.role !== "MASTER") {
    router.replace("/dashboard"); // Redireciona se não for MASTER
    return null;
  }

  const openAddModal = () => {
    setCurrentUser(null);
    setFormState({
      nome: "",
      email: "",
      whatsapp: "",
      senha: "",
      role: "USER",
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    setCurrentUser(user);
    setFormState({ ...user, senha: "" }); // Não preenche a senha no modo de edição
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (user: UserProfile) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Lógica para salvar (criar ou editar) usuário no Firebase Auth e Firestore
    setIsFormModalOpen(false);
  };

  const handleDelete = () => {
    // Lógica para deletar usuário
    setIsDeleteModalOpen(false);
  };

  const modalTitle = currentUser ? "Editar Usuário" : "Adicionar Novo Usuário";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Usuários</h1>
        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">Adicionar Usuários</span>
          <span className="sm:hidden">Usuários</span>
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        {/* Cabeçalho da Tabela - Apenas Desktop */}
        <div className="hidden sm:grid grid-cols-12 gap-4 p-3 text-sm font-bold text-gray-500 border-b">
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
      </div>

      {/* Modal de Adicionar/Editar Usuário */}
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
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação para Excluir */}
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
