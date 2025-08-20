"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UserProfile } from "@/types";
import { Bell, BellOff, BellRing } from "lucide-react";
import { AppButton } from "./AppButton"; // ADICIONADO

interface NotificationBellProps {
  userProfile: UserProfile;
}

export const NotificationBell = ({ userProfile }: NotificationBellProps) => {
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (userProfile.role === "USER" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [userProfile.role]);

  const handleSubscribeToNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
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
    default:
      return (
        <AppButton
          onClick={handleSubscribeToNotifications}
          variant="ghost"
          size="icon"
          className="!rounded-full !text-slate-300 data-[hover]:!bg-slate-700 data-[hover]:!text-white"
          title="Ativar notificações"
        >
          <Bell size={20} />
        </AppButton>
      );
  }
};
