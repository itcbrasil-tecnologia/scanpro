"use client";

import React, { useState, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { UserProfile } from "@/types";
import { Menu, Transition, Dialog } from "@headlessui/react";
import {
  LogOut,
  User,
  KeyRound,
  ChevronDown,
  Menu as MenuIcon,
  X,
  LayoutDashboard,
  FileText,
  Laptop,
  Users,
  Home,
  Truck,
  BriefcaseBusiness,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { NotificationBell } from "./NotificationBell";
import { AppButton } from "./AppButton";
import clsx from "clsx";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface NavbarProps {
  userProfile: UserProfile;
}

export default function Navbar({ userProfile }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileAdminOpen, setIsMobileAdminOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      await signOut(auth);
      toast.success("Você saiu com sucesso!", { id: "global-toast" });
      router.push("/");
    } catch (error) {
      console.error("Erro ao tentar sair:", error);
      toast.error("Erro ao tentar sair.", { id: "global-toast" });
    }
  };

  const isAdminOrMaster =
    userProfile.role === "ADMIN" || userProfile.role === "MASTER";

  const adminMenuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Relatórios", href: "/relatorios", icon: FileText },
  ];
  const adminDropdownItems = [
    { name: "Projetos", href: "/projetos", icon: BriefcaseBusiness },
    { name: "UMs", href: "/ums", icon: Truck },
    { name: "Notebooks", href: "/notebooks", icon: Laptop },
    { name: "Notificações", href: "/notificacoes", icon: MessageSquare },
    ...(userProfile.role === "MASTER"
      ? [{ name: "Usuários", href: "/usuarios", icon: Users }]
      : []),
  ];

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
    setIsMobileAdminOpen(false);
  };

  const NavLink = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link href={href} passHref>
      <div
        className={clsx(
          "px-4 py-2 rounded-md text-base font-medium transition-colors",
          pathname === href
            ? "bg-slate-700 text-white dark:bg-zinc-700"
            : "text-slate-300 hover:bg-slate-700 hover:text-white dark:hover:bg-zinc-700"
        )}
      >
        {children}
      </div>
    </Link>
  );

  const Logo = () => (
    <Link
      href={isAdminOrMaster ? "/dashboard" : "/inicio"}
      className="flex-shrink-0 flex items-center"
    >
      <Image
        src="/Logo.svg"
        alt="ScanPRO Logo"
        width={120}
        height={30}
        priority
      />
    </Link>
  );

  const UserMenu = () => (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center text-sm rounded-full text-slate-300 hover:text-white hover:bg-slate-700 dark:hover:bg-zinc-700 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
        <User size={24} />
        <span className="hidden sm:inline ml-2">
          {userProfile.nome.split(" ")[0]}
        </span>
        <ChevronDown size={16} className="ml-1" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 dark:bg-zinc-800 dark:ring-zinc-700">
          <div className="px-4 py-3 text-sm text-slate-500 border-b border-slate-200 dark:text-slate-400 dark:border-zinc-700">
            <p>Sessão iniciada como</p>
            <p className="font-medium text-slate-800 truncate dark:text-slate-200">
              {userProfile.email}
            </p>
          </div>
          <Menu.Item>
            {({ active }) => (
              <Link
                href="/inicio"
                className={clsx(
                  "flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300",
                  active && "bg-slate-100 dark:bg-zinc-700"
                )}
              >
                <Home
                  size={16}
                  className="mr-3 text-slate-500 dark:text-slate-400"
                />
                Início
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <Link
                href="/alterar-senha"
                className={clsx(
                  "flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300",
                  active && "bg-slate-100 dark:bg-zinc-700"
                )}
              >
                <KeyRound
                  size={16}
                  className="mr-3 text-slate-500 dark:text-slate-400"
                />
                Alterar Senha
              </Link>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <AppButton
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className={clsx(
                  "w-full !justify-start !font-normal !text-red-600 dark:!text-red-400 !px-4 !py-2",
                  active && "!bg-red-50 dark:!bg-red-900/20"
                )}
              >
                <LogOut size={16} className="mr-3" /> Sair
              </AppButton>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  return (
    <>
      <nav className="bg-slate-800 dark:bg-zinc-950 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Logo />
            </div>
            {isAdminOrMaster ? (
              <div className="hidden md:flex flex-1 items-center justify-center">
                <div className="flex items-baseline space-x-4">
                  {adminMenuItems.map((item) => (
                    <NavLink key={item.name} href={item.href}>
                      {item.name}
                    </NavLink>
                  ))}
                  <Menu as="div" className="relative">
                    <Menu.Button
                      className={clsx(
                        "px-4 py-2 rounded-md text-base font-medium transition-colors flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75",
                        pathname.startsWith("/projetos") ||
                          pathname.startsWith("/ums") ||
                          pathname.startsWith("/notebooks") ||
                          pathname.startsWith("/usuarios") ||
                          pathname.startsWith("/notificacoes")
                          ? "bg-slate-700 text-white dark:bg-zinc-700"
                          : "text-slate-300 hover:bg-slate-700 hover:text-white dark:hover:bg-zinc-700"
                      )}
                    >
                      <span>Administração</span>
                      <ChevronDown size={16} className="ml-1" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="origin-top-center absolute mt-2 w-48 rounded-md shadow-lg py-1 bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10 dark:bg-zinc-800 dark:ring-zinc-700">
                        {adminDropdownItems.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <Link
                                href={item.href}
                                className={clsx(
                                  "flex items-center w-full px-4 py-2 text-sm text-slate-200",
                                  active
                                    ? "bg-slate-700 text-white dark:bg-zinc-700"
                                    : ""
                                )}
                              >
                                <item.icon size={16} className="mr-3" />
                                {item.name}
                              </Link>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center"></div>
            )}

            <div className="hidden md:flex items-center space-x-2">
              <ThemeSwitcher />
              <NotificationBell userProfile={userProfile} />
              <UserMenu />
            </div>

            <div className="md:hidden flex items-center ml-auto space-x-2">
              <ThemeSwitcher />
              <NotificationBell userProfile={userProfile} />
              <AppButton
                onClick={() => setIsMobileMenuOpen(true)}
                variant="ghost"
                size="icon"
                className="!text-slate-300 data-[hover]:!text-white"
              >
                <MenuIcon size={24} />
              </AppButton>
            </div>
          </div>
        </div>
      </nav>

      <Transition appear show={isMobileMenuOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 md:hidden"
          onClose={() => setIsMobileMenuOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="w-full max-w-xs transform overflow-hidden bg-slate-800 dark:bg-zinc-950 text-left align-middle shadow-xl transition-all">
                  <div className="p-4 flex justify-between items-center border-b border-slate-700 dark:border-zinc-800">
                    <Logo />
                    <AppButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="ghost"
                      size="icon"
                      className="!text-slate-300 data-[hover]:!text-white"
                    >
                      <X size={24} />
                    </AppButton>
                  </div>
                  <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {isAdminOrMaster ? (
                      <>
                        {adminMenuItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={handleMobileLinkClick}
                            className="flex items-center text-slate-200 hover:bg-slate-700 hover:text-white dark:hover:bg-zinc-700 px-3 py-2 rounded-md text-base font-medium"
                          >
                            <item.icon size={18} className="mr-3" />
                            {item.name}
                          </Link>
                        ))}
                        <AppButton
                          onClick={() => setIsMobileAdminOpen((prev) => !prev)}
                          variant="ghost"
                          className="w-full !justify-between !text-slate-200 data-[hover]:!bg-slate-700 data-[hover]:!text-white dark:hover:!bg-zinc-700 !px-3 !py-2 !text-base !font-medium"
                        >
                          <div className="flex items-center">
                            <ChevronDown
                              size={18}
                              className="mr-3 transition-transform"
                              style={{
                                transform: isMobileAdminOpen
                                  ? "rotate(0deg)"
                                  : "rotate(-90deg)",
                              }}
                            />
                            Administração
                          </div>
                        </AppButton>
                        {isMobileAdminOpen && (
                          <div className="pl-8">
                            {adminDropdownItems.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                onClick={handleMobileLinkClick}
                                className="flex items-center text-slate-200 hover:bg-slate-700 hover:text-white dark:hover:bg-zinc-700 px-3 py-2 rounded-md text-base font-medium"
                              >
                                <item.icon size={18} className="mr-3" />
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href="/inicio"
                        onClick={handleMobileLinkClick}
                        className="flex items-center text-slate-200 hover:bg-slate-700 hover:text-white dark:hover:bg-zinc-700 px-3 py-2 rounded-md text-base font-medium"
                      >
                        <Home size={18} className="mr-3" />
                        Início
                      </Link>
                    )}
                  </div>
                  <div className="pt-4 pb-3 border-t border-slate-700 dark:border-zinc-800">
                    <div className="flex items-center px-5">
                      <div className="flex-shrink-0">
                        <User size={24} className="text-slate-300" />
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium leading-none text-white">
                          {userProfile.nome}
                        </div>
                        <div className="text-sm font-medium leading-none text-slate-400">
                          {userProfile.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 px-2 space-y-1">
                      <Link
                        href="/alterar-senha"
                        onClick={handleMobileLinkClick}
                        className="flex items-center text-slate-200 hover:bg-slate-700 hover:text-white dark:hover:bg-zinc-700 px-3 py-2 rounded-md text-base font-medium"
                      >
                        <KeyRound size={18} className="mr-3" />
                        Alterar Senha
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center text-red-400 hover:bg-slate-700 hover:text-red-300 dark:hover:bg-zinc-700 px-3 py-2 rounded-md text-base font-medium"
                      >
                        <LogOut size={18} className="mr-3" />
                        Sair
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
