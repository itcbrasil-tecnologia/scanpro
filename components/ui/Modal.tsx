"use client";

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, icon }: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* CORREÇÃO: 'overflow-hidden' foi removido deste painel */}
              <Dialog.Panel className="w-full max-w-lg transform rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center p-4 border-b">
                  <div className="flex items-center">
                    {icon && <div className="mr-3">{icon}</div>}
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-bold text-gray-800"
                    >
                      {title}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Fechar modal"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* CORREÇÃO: O controle de scroll agora está neste container interno */}
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
