"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Joue un bip sonore dès qu'une nouvelle commande est enregistrée par un
 * commercial, tant que cette page est ouverte (admin connecté).
 *
 * Fonctionnement : écoute en temps réel (Supabase Realtime) les nouvelles
 * lignes de la table `notifications` de type "nouvelle_commande" destinées
 * à cet admin, et génère un bip via l'API Web Audio (aucun fichier audio
 * nécessaire).
 *
 * Limite connue des navigateurs : la lecture automatique d'un son peut être
 * bloquée tant qu'aucune interaction (clic, etc.) n'a eu lieu sur la page
 * depuis son ouverture — c'est une règle de sécurité des navigateurs, pas
 * un bug de l'application. Une fois qu'un premier clic a eu lieu sur la
 * page (n'importe où), le son fonctionne normalement pour la suite.
 */
export function SonNouvelleCommande({ adminId }: { adminId: string }) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    function jouerBip() {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
        const ctx = audioContextRef.current;

        const oscillateur = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillateur.type = "sine";
        oscillateur.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        oscillateur.connect(gain);
        gain.connect(ctx.destination);
        oscillateur.start();
        oscillateur.stop(ctx.currentTime + 0.6);
      } catch {
        // Lecture audio bloquée par le navigateur (pas encore d'interaction) — ignoré silencieusement.
      }
    }

    const supabase = createClient();
    const channel = supabase
      .channel("notifications-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `destinataire_id=eq.${adminId}` },
        (payload) => {
          const type = (payload.new as { type?: string }).type;
          if (type === "nouvelle_commande") jouerBip();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId]);

  return null;
}
