"use client";

import { useEffect } from "react";
import { enregistrerAbonnementPush } from "@/app/admin/push/actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Active les vraies notifications système (comme WhatsApp/Facebook) pour
 * l'admin : fonctionnent même quand l'application est fermée ou en arrière-
 * plan, tant que l'appareil est connecté à internet. Nécessite d'avoir
 * installé l'application sur l'écran d'accueil (ou d'utiliser un navigateur
 * qui supporte les notifications push).
 */
export function PushNotificationSetup() {
  useEffect(() => {
    const cleVapide = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!cleVapide) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function activer() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(cleVapide!) as BufferSource,
          });
        }

        const json = subscription.toJSON();
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          await enregistrerAbonnementPush({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          });
        }
      } catch {
        // Navigateur ne supportant pas les notifications push, ou
        // permission refusée — on n'interrompt rien, juste pas de
        // notification système pour cet appareil.
      }
    }

    activer();
  }, []);

  return null;
}
