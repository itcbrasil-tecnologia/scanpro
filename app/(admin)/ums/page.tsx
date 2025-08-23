"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
} from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Disclosure,
  Transition,
  Switch,
  Listbox,
  Field,
  Label,
  Input,
} from "@headlessui/react";
import { NumberInput } from "@/components/ui/NumberInput";
import { AppButton } from "@/components/ui/AppButton";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface UM {
  id: string;
  name: string;
  projectId: string;
  expectedNotebooks: number;
  expectedPeripherals?: string[];
}

const AVAILABLE_PERIPHERALS = ["mouse", "carregador", "fone"];

const PERIPHERAL_LABELS: { [key: string]: string } = {
  mouse: "Mouse",
  carregador: "Carregador",
  fone: "Fone de Ouvido",
};

function UMListItem({
  um,
  project,
  onEdit,
  onDelete,
}: {
  um: UM;
  project?: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const actionButtonClasses =
    "bg-slate-100 data-[hover]:bg-slate-200 dark:bg-zinc-700/50 dark:data-[hover]:bg-zinc-700";

  return (
    <div className="bg-slate-50 rounded-md dark:bg-zinc-900/50">
      <div className="hidden sm:grid grid-cols-4 gap-4 items-center p-3">
        <div className="col-span-1 flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-4 flex-shrink-0"
            style={{ backgroundColor: project?.color || "#ccc" }}
          ></div>
          <span className="font-semibold text-gray-700 dark:text-zinc-200">
            {um.name}
          </span>
        </div>
        <div className="col-span-1 text-slate-600 dark:text-zinc-300">
          {project?.name}
        </div>
        <div className="col-span-1 text-center text-slate-600 dark:text-zinc-300">
          {um.expectedNotebooks}
        </div>
        <div className="col-span-1 flex items-center justify-end space-x-3">
          <AppButton
            onClick={onEdit}
            variant="ghost"
            size="icon"
            className={actionButtonClasses}
          >
            <Edit size={20} />
          </AppButton>
          <AppButton
            onClick={onDelete}
            variant="ghost"
            size="icon"
            className={`${actionButtonClasses} data-[hover]:text-red-600`}
          >
            <Trash2 size={20} />
          </AppButton>
        </div>
      </div>
      <div className="sm:hidden">
        <Disclosure as="div">
          {({ open }) => (
            <>
              <Disclosure.Button className="w-full flex items-center justify-between p-3 text-left">
                <div>
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">
                    {um.name}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {project?.name}
                  </p>
                </div>
                <ChevronDown
                  size={20}
                  className={`transition-transform ${open ? "rotate-180" : ""}`}
                />
              </Disclosure.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 -translate-y-1"
                enterTo="transform opacity-100 translate-y-0"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 translate-y-0"
                leaveTo="transform opacity-0 -translate-y-1"
              >
                <Disclosure.Panel className="p-4 border-t border-slate-200 dark:border-zinc-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600 dark:text-zinc-300">
                      Notebooks Esperados:
                    </span>
                    <span className="font-semibold dark:text-zinc-100">
                      {um.expectedNotebooks}
                    </span>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <AppButton
                      onClick={onEdit}
                      variant="secondary"
                      size="sm"
                      className="flex items-center"
                    >
                      <Edit size={16} className="mr-1" /> Editar
                    </AppButton>
                    <AppButton
                      onClick={onDelete}
                      variant="danger"
                      size="sm"
                      className="flex items-center !bg-red-100 !text-red-700 data-[hover]:!bg-red-200"
                    >
                      <Trash2 size={16} className="mr-1" /> Excluir
                    </AppButton>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </div>
    </div>
  );
}

export default function UMsPage() {
  const [ums, setUms] = useState<UM[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUm, setCurrentUm] = useState<UM | null>(null);
  const [umToDelete, setUmToDelete] = useState<UM | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    projectId: "",
    expectedNotebooks: 0,
    peripherals: AVAILABLE_PERIPHERALS.reduce(
      (acc, curr) => ({ ...acc, [curr]: true }),
      {} as Record<string, boolean>
    ),
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectsCollection = collection(db, "projects");
      const projectSnapshot = await getDocs(projectsCollection);
      const projectsList = projectSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Project)
      );
      setProjects(projectsList);

      const umsCollection = collection(db, "ums");
      const umSnapshot = await getDocs(umsCollection);
      const umsList = umSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as UM)
      );
      setUms(umsList);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Não foi possível carregar os dados.", {
        id: "global-toast",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedUms = useMemo(() => {
    return projects
      .map((project) => ({
        ...project,
        ums: ums.filter((um) => um.projectId === project.id),
      }))
      .filter((project) => project.ums.length > 0);
  }, [projects, ums]);

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSwitchChange = (peripheralName: string, checked: boolean) => {
    setFormState((prevState) => ({
      ...prevState,
      peripherals: {
        ...prevState.peripherals,
        [peripheralName]: checked,
      },
    }));
  };

  const handleListBoxChange = (value: string) => {
    setFormState((prevState) => ({ ...prevState, projectId: value }));
  };

  const handleNumberInputChange = (value: number) => {
    setFormState((prevState) => ({ ...prevState, expectedNotebooks: value }));
  };

  const openAddModal = () => {
    setCurrentUm(null);
    setFormState({
      name: "",
      projectId: projects[0]?.id || "",
      expectedNotebooks: 0,
      peripherals: AVAILABLE_PERIPHERALS.reduce(
        (acc, curr) => ({ ...acc, [curr]: true }),
        {} as Record<string, boolean>
      ),
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (um: UM) => {
    setCurrentUm(um);
    setFormState({
      name: um.name,
      projectId: um.projectId,
      expectedNotebooks: um.expectedNotebooks,
      peripherals: AVAILABLE_PERIPHERALS.reduce(
        (acc, curr) => ({
          ...acc,
          [curr]: um.expectedPeripherals?.includes(curr) ?? true,
        }),
        {} as Record<string, boolean>
      ),
    });
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (um: UM) => {
    setUmToDelete(um);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
  };

  const handleSave = async () => {
    if (!formState.name || !formState.projectId) {
      toast.error("Nome da UM e Projeto são obrigatórios.", {
        id: "global-toast",
      });
      return;
    }

    const expectedPeripherals = Object.entries(formState.peripherals)
      .filter(([, isChecked]) => isChecked)
      .map(([peripheralName]) => peripheralName);

    const umData = {
      name: formState.name,
      projectId: formState.projectId,
      expectedNotebooks: Number(formState.expectedNotebooks) || 0,
      expectedPeripherals,
    };

    try {
      if (currentUm) {
        const umRef = doc(db, "ums", currentUm.id);
        await setDoc(umRef, umData);
        toast.success(`UM "${umData.name}" atualizada com sucesso!`, {
          id: "global-toast",
        });
      } else {
        const umsCollection = collection(db, "ums");
        await addDoc(umsCollection, umData);
        toast.success(`UM "${umData.name}" adicionada com sucesso!`, {
          id: "global-toast",
        });
      }
      fetchData();
      closeModals();
    } catch (error) {
      console.error("Erro ao salvar UM:", error);
      toast.error("Ocorreu um erro ao salvar a UM.", { id: "global-toast" });
    }
  };

  const handleDelete = async () => {
    if (!umToDelete) return;
    try {
      const notebooksQuery = query(
        collection(db, "notebooks"),
        where("umId", "==", umToDelete.id),
        limit(1)
      );
      const notebooksSnapshot = await getDocs(notebooksQuery);

      if (!notebooksSnapshot.empty) {
        toast.error(
          "Não é possível excluir. Existem notebooks associados a esta UM.",
          {
            id: "global-toast",
          }
        );
        closeModals();
        return;
      }
      const umRef = doc(db, "ums", umToDelete.id);
      await deleteDoc(umRef);
      toast.success(`UM "${umToDelete.name}" excluída com sucesso!`, {
        id: "global-toast",
      });
      fetchData();
      closeModals();
    } catch (error) {
      console.error("Erro ao excluir UM:", error);
      toast.error("Ocorreu um erro ao excluir a UM.", {
        id: "global-toast",
      });
    }
  };

  const modalTitle = currentUm ? "Editar UM" : "Adicionar Nova UM";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-zinc-100">
          Gerenciar UMs
        </h1>
        <AppButton onClick={openAddModal} className="mt-4 sm:mt-0">
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">Adicionar UM</span>
          <span className="sm:hidden">UM</span>
        </AppButton>
      </div>
      {isLoading ? (
        <p className="text-center text-gray-500 py-8 dark:text-zinc-400">
          Carregando dados...
        </p>
      ) : (
        <div className="space-y-6">
          {groupedUms.map((project) => (
            <div
              key={project.id}
              className="bg-white p-4 rounded-lg shadow-md dark:bg-zinc-800"
            >
              <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center dark:text-zinc-200">
                <div
                  className="w-5 h-5 rounded-full mr-3"
                  style={{
                    backgroundColor: project.color || "#ccc",
                  }}
                ></div>
                {project.name}
              </h2>
              <div className="hidden sm:grid grid-cols-4 gap-4 p-3 text-sm font-semibold text-slate-500 border-b dark:text-zinc-400 dark:border-zinc-700">
                <div className="col-span-1">Nome da UM</div>
                <div className="col-span-1">Projeto</div>
                <div className="col-span-1 text-center">
                  Notebooks Esperados
                </div>
                <div className="col-span-1 text-right">Ações</div>
              </div>
              <div className="space-y-2 mt-2">
                {project.ums.map((um: UM) => (
                  <UMListItem
                    key={um.id}
                    um={um}
                    project={projects.find((p) => p.id === um.projectId)}
                    onEdit={() => openEditModal(um)}
                    onDelete={() => openDeleteModal(um)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isFormModalOpen} onClose={closeModals} title={modalTitle}>
        <div className="space-y-4">
          <Field>
            <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Nome da UM
            </Label>
            <Input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleFormInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md data-[hover]:border-teal-400 focus:ring-teal-500 focus:border-teal-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-200"
            />
          </Field>
          <Field>
            <Listbox value={formState.projectId} onChange={handleListBoxChange}>
              <div className="relative">
                <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Projeto
                </Listbox.Label>
                <Listbox.Button className="relative mt-1 w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm dark:bg-zinc-700 dark:border-zinc-600">
                  <span className="block truncate dark:text-zinc-200">
                    {projects.find((p) => p.id === formState.projectId)?.name}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10 dark:bg-zinc-900 dark:ring-zinc-700">
                    {projects.map((project) => (
                      <Listbox.Option
                        key={project.id}
                        value={project.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-teal-100 text-teal-900 dark:bg-zinc-700"
                              : "text-gray-900 dark:text-zinc-200"
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
                              {project.name}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600 dark:text-teal-400">
                                <Check className="h-5 w-5" aria-hidden="true" />
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
          </Field>
          <Field>
            <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Quantidade de Notebooks Esperados
            </Label>
            <div className="mt-1">
              <NumberInput
                value={formState.expectedNotebooks}
                onChange={handleNumberInputChange}
              />
            </div>
          </Field>
          <Field>
            <Label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Periféricos Esperados
            </Label>
            <div className="mt-2 space-y-3">
              {AVAILABLE_PERIPHERALS.map((peripheral) => (
                <Switch.Group
                  key={peripheral}
                  as="div"
                  className="flex items-center justify-between"
                >
                  <Switch.Label className="text-sm text-gray-900 cursor-pointer dark:text-zinc-200">
                    {PERIPHERAL_LABELS[peripheral]}
                  </Switch.Label>
                  <Switch
                    checked={formState.peripherals[peripheral]}
                    onChange={(checked) =>
                      handleSwitchChange(peripheral, checked)
                    }
                    className={`${
                      formState.peripherals[peripheral]
                        ? "bg-teal-600"
                        : "bg-gray-200 dark:bg-zinc-600"
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        formState.peripherals[peripheral]
                          ? "translate-x-6"
                          : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </Switch.Group>
              ))}
            </div>
          </Field>
          <div className="flex justify-end pt-4">
            <AppButton onClick={handleSave}>Salvar</AppButton>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a UM "${umToDelete?.name}"? Esta ação é irreversível.`}
        confirmButtonText="Confirmar Exclusão"
        confirmButtonVariant="danger"
      />
    </div>
  );
}
