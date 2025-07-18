// components/ui/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { UserProfile } from "@/types";
import {
  LogOut,
  User,
  KeyRound,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Building,
  Laptop,
  Users,
  Home,
} from "lucide-react";
import toast from "react-hot-toast";

interface NavbarProps {
  userProfile: UserProfile;
}

export function Navbar({ userProfile }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Você saiu com sucesso!");
    } catch (error) {
      // Adicionamos o console.error para usar a variável e registrar o erro.
      console.error("Erro ao tentar sair:", error);
      toast.error("Erro ao tentar sair.");
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        adminDropdownRef.current &&
        !adminDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAdminDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdminOrMaster =
    userProfile.role === "ADMIN" || userProfile.role === "MASTER";

  const adminMenuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Relatórios", href: "/relatorios", icon: FileText },
  ];
  const adminDropdownItems = [
    { name: "Projetos", href: "/projetos", icon: Building },
    { name: "UMs", href: "/ums", icon: Building },
    { name: "Notebooks", href: "/notebooks", icon: Laptop },
    ...(userProfile.role === "MASTER"
      ? [{ name: "Usuários", href: "/usuarios", icon: Users }]
      : []),
  ];

  const NavLink = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link href={href} passHref>
      <div
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          pathname === href
            ? "bg-indigo-700 text-white"
            : "text-gray-300 hover:bg-indigo-600 hover:text-white"
        }`}
      >
        {children}
      </div>
    </Link>
  );

  if (isAdminOrMaster) {
    return (
      <nav className="bg-indigo-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-white font-bold text-xl">
                ScanPRO
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  {adminMenuItems.map((item) => (
                    <NavLink key={item.name} href={item.href}>
                      {item.name}
                    </NavLink>
                  ))}
                  <div className="relative" ref={adminDropdownRef}>
                    <button
                      onClick={() => setIsAdminDropdownOpen((prev) => !prev)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                        pathname.startsWith("/projetos") ||
                        pathname.startsWith("/ums") ||
                        pathname.startsWith("/notebooks") ||
                        pathname.startsWith("/usuarios")
                          ? "bg-indigo-700 text-white"
                          : "text-gray-300 hover:bg-indigo-600 hover:text-white"
                      }`}
                    >
                      <span>Administração</span>
                      <ChevronDown size={16} className="ml-1" />
                    </button>
                    {isAdminDropdownOpen && (
                      <div className="origin-top-right absolute mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                        {adminDropdownItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsAdminDropdownOpen(false)}
                          >
                            <item.icon size={16} className="mr-2" /> {item.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block" ref={userDropdownRef}>
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                  className="flex items-center text-sm rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-800 focus:ring-white"
                >
                  <User size={24} />
                  <span className="ml-2">{userProfile.nome.split(" ")[0]}</span>
                  <ChevronDown size={16} className="ml-1" />
                </button>
                {isUserDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      <p>Sessão iniciada como</p>
                      <p className="font-medium text-gray-800 truncate">
                        {userProfile.email}
                      </p>
                    </div>
                    <Link
                      href="/alterar-senha"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <KeyRound size={16} className="mr-2" /> Alterar Senha
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} className="mr-2" /> Sair
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-indigo-700 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {adminMenuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center text-gray-300 hover:bg-indigo-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  <item.icon size={18} className="mr-3" />
                  {item.name}
                </Link>
              ))}
              <div className="text-gray-300 px-3 py-2 text-base font-medium">
                Administração
              </div>
              <div className="pl-4">
                {adminDropdownItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center text-gray-300 hover:bg-indigo-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                  >
                    <item.icon size={18} className="mr-3" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="pt-4 pb-3 border-t border-indigo-700">
              <div className="flex items-center px-5">
                <User size={24} className="text-white" />
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-white">
                    {userProfile.nome}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-400">
                    {userProfile.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link
                  href="/alterar-senha"
                  className="flex items-center text-gray-300 hover:bg-indigo-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  <KeyRound size={18} className="mr-3" />
                  Alterar Senha
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center text-red-400 hover:bg-indigo-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  <LogOut size={18} className="mr-3 text-red-400" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    );
  } else {
    return (
      <nav className="bg-indigo-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/inicio" className="text-white font-bold text-xl">
              ScanPRO
            </Link>
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-indigo-700 focus:outline-none"
              >
                <Menu size={24} />
              </button>
              {isUserDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <Link
                    href="/inicio"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <Home size={16} className="mr-2" /> Início
                  </Link>
                  <div className="border-t my-1"></div>
                  <Link
                    href="/alterar-senha"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <KeyRound size={16} className="mr-2" /> Alterar Senha
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} className="mr-2 text-red-600" />{" "}
                    <span className="text-red-600">Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }
}
