"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Joue un son dès qu'une nouvelle commande est enregistrée par un
 * commercial, tant que cette page est ouverte (admin connecté).
 *
 * Fonctionnement : écoute en temps réel (Supabase Realtime) les nouvelles
 * lignes de la table `notifications` de type "nouvelle_commande" destinées
 * à cet admin. Si l'admin a uploadé un son personnalisé depuis Paramètres,
 * celui-ci est joué ; sinon, un bip généré (API Web Audio) sert de repli.
 *
 * Limite connue des navigateurs : la lecture automatique d'un son peut être
 * bloquée tant qu'aucune interaction (clic, etc.) n'a eu lieu sur la page
 * depuis son ouverture — c'est une règle de sécurité des navigateurs, pas
 * un bug de l'application. Une fois qu'un premier clic a eu lieu sur la
 * page (n'importe où), le son fonctionne normalement pour la suite.
 */
export function SonNouvelleCommande({ adminId }: { adminId: string }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [sonPersonnaliseUrl, setSonPersonnaliseUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function chargerSonPersonnalise() {
      const { data } = await supabase.from("settings").select("valeur").eq("cle", "son_notification_url").maybeSingle();
      if (data?.valeur) setSonPersonnaliseUrl(data.valeur as string);
    }
    chargerSonPersonnalise();

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

    function jouerSon() {
      if (sonPersonnaliseUrl) {
        const audio = new Audio(sonPersonnaliseUrl);
        audio.play().catch(() => jouerBip());
      } else {
        jouerBip();
      }
    }

    const channel = supabase
      .channel("notifications-admin")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `destinataire_id=eq.${adminId}` },
        (payload) => {
          const type = (payload.new as { type?: string }).type;
          if (type === "nouvelle_commande") jouerSon();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId, sonPersonnaliseUrl]);

  return null;
}
