"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Laptop,
  Users,
  Home,
  Truck,
  BriefcaseBusiness,
  Bell,
  BellOff,
  BellRing,
} from "lucide-react";
import toast from "react-hot-toast";

interface NavbarProps {
  userProfile: UserProfile;
}

export function Navbar({ userProfile }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileAdminOpen, setIsMobileAdminOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  const pathname = usePathname();
  const router = useRouter();
  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile.role === "USER" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [userProfile.role]);

  const handleSubscribeToNotifications = async () => {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !userProfile
    ) {
      toast.error("Seu navegador não suporta notificações push.");
      return;
    }
    try {
      const sw = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("Chave VAPID pública não configurada.");
        toast.error("Erro de configuração para notificações.");
        return;
      }
      const subscription = await sw.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // Salva a inscrição no Firestore
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userProfile.uid,
          subscription: subscription,
        }),
      });

      toast.success("Notificações ativadas com sucesso!");
      setNotificationPermission("granted");

      // CHAMA A API PARA ENVIAR A NOTIFICAÇÃO DE BOAS-VINDAS
      await fetch("/api/notifications/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userProfile.uid }),
      });
    } catch (error) {
      console.error("Erro ao se inscrever para notificações:", error);
      setNotificationPermission(Notification.permission);
      toast.error(
        "Não foi possível ativar as notificações. Você precisa dar permissão no pop-up do navegador."
      );
    }
  };

  const NotificationBell = () => {
    // Renderiza o componente apenas para o perfil USER
    if (userProfile.role !== "USER") {
      return null;
    }

    switch (notificationPermission) {
      case "granted":
        return (
          <div
            className="flex items-center p-2 text-green-400"
            title="Notificações ativadas"
          >
            <BellRing size={20} />
          </div>
        );
      case "denied":
        return (
          <div
            className="flex items-center p-2 text-red-400"
            title="Notificações bloqueadas. Habilite nas configurações do navegador."
          >
            <BellOff size={20} />
          </div>
        );
      case "default":
      default:
        return (
          <button
            onClick={handleSubscribeToNotifications}
            className="flex items-center p-2 text-slate-300 hover:text-white rounded-full transition-colors hover:bg-slate-700"
            title="Ativar notificações"
          >
            <Bell size={20} />
          </button>
        );
    }
  };

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
    { name: "Projetos", href: "/projetos", icon: BriefcaseBusiness },
    { name: "UMs", href: "/ums", icon: Truck },
    { name: "Notebooks", href: "/notebooks", icon: Laptop },
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
        className={`px-4 py-2 rounded-md text-base font-medium transition-colors ${
          pathname === href
            ? "bg-slate-700 text-white"
            : "text-slate-300 hover:bg-slate-700 hover:text-white"
        }`}
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
    <div className="relative" ref={userDropdownRef}>
      <button
        onClick={() => setIsUserDropdownOpen((prev) => !prev)}
        className="flex items-center text-sm rounded-full text-slate-300 hover:text-white hover:bg-slate-700 p-2 focus:outline-none"
      >
        <User size={24} />
        <span className="ml-2">{userProfile.nome.split(" ")[0]}</span>
        <ChevronDown size={16} className="ml-1" />
      </button>
      {isUserDropdownOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white z-10">
          <div className="px-4 py-2 text-sm text-slate-500 border-b border-slate-200">
            <p>Sessão iniciada como</p>
            <p className="font-medium text-slate-800 truncate">
              {userProfile.email}
            </p>
          </div>
          {!isAdminOrMaster && (
            <Link
              href="/inicio"
              className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              onClick={() => setIsUserDropdownOpen(false)}
            >
              <Home size={16} className="mr-2 text-slate-500" /> Início
            </Link>
          )}
          <Link
            href="/alterar-senha"
            className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            onClick={() => setIsUserDropdownOpen(false)}
          >
            <KeyRound size={16} className="mr-2 text-slate-500" /> Alterar Senha
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
  );

  return (
    <nav className="bg-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Logo />
          </div>
          {isAdminOrMaster && (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="flex items-baseline space-x-4">
                {adminMenuItems.map((item) => (
                  <NavLink key={item.name} href={item.href}>
                    {item.name}
                  </NavLink>
                ))}
                <div className="relative" ref={adminDropdownRef}>
                  <button
                    onClick={() => setIsAdminDropdownOpen((prev) => !prev)}
                    className={`px-4 py-2 rounded-md text-base font-medium transition-colors flex items-center ${
                      pathname.startsWith("/projetos") ||
                      pathname.startsWith("/ums") ||
                      pathname.startsWith("/notebooks") ||
                      pathname.startsWith("/usuarios")
                        ? "bg-slate-700 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <span>Administração</span>
                    <ChevronDown size={16} className="ml-1" />
                  </button>
                  {isAdminDropdownOpen && (
                    <div className="origin-top-right absolute mt-2 w-48 rounded-md shadow-lg py-1 bg-slate-800 z-10">
                      {adminDropdownItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white"
                          onClick={() => setIsAdminDropdownOpen(false)}
                        >
                          <item.icon size={16} className="mr-2" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="hidden md:flex items-center space-x-2">
            <NotificationBell />
            <UserMenu />
          </div>
          <div className="md:hidden flex items-center">
            <div className="md:hidden absolute left-4">
              <Logo />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAdminOrMaster ? (
              <>
                {adminMenuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleMobileLinkClick}
                    className="flex items-center text-slate-200 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                  >
                    <item.icon size={18} className="mr-3" />
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={() => setIsMobileAdminOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-slate-200 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
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
                </button>
                {isMobileAdminOpen && (
                  <div className="pl-8">
                    {adminDropdownItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={handleMobileLinkClick}
                        className="flex items-center text-slate-200 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
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
                className="flex items-center text-slate-200 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
              >
                <Home size={18} className="mr-3" />
                Início
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-slate-700">
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
              <div className="ml-auto flex items-center">
                <NotificationBell />
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                href="/alterar-senha"
                onClick={handleMobileLinkClick}
                className="flex items-center text-slate-200 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-base font-medium"
              >
                <KeyRound size={18} className="mr-3" />
                Alterar Senha
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center text-red-400 hover:bg-slate-700 hover:text-red-300 px-3 py-2 rounded-md text-base font-medium"
              >
                <LogOut size={18} className="mr-3" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
