"use client";

import { useMemo, useState } from "react";

const MOIS_LABELS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export interface FiltreDateValeur {
  annee: number;
  mois: number | null; // 0-11, null = tous les mois
  jour: number | null; // 1-31, null = tous les jours
}

/**
 * Filtre Année / Mois / Jour réutilisable. L'année par défaut est l'année en
 * cours ; les années proposées sont déduites des dates réellement présentes
 * dans les données (+ l'année en cours), pour ne pas afficher d'années vides.
 */
export function FiltreDate({
  dates,
  valeur,
  onChange,
}: {
  dates: string[]; // dates ISO (YYYY-MM-DD) présentes dans les données, pour déduire les années disponibles
  valeur: FiltreDateValeur;
  onChange: (v: FiltreDateValeur) => void;
}) {
  const anneesDisponibles = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    for (const d of dates) set.add(Number(d.slice(0, 4)));
    return Array.from(set).sort((a, b) => b - a);
  }, [dates]);

  const joursDansLeMois = useMemo(() => {
    if (valeur.mois == null) return 31;
    return new Date(valeur.annee, valeur.mois + 1, 0).getDate();
  }, [valeur.annee, valeur.mois]);

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={valeur.annee}
        onChange={(e) => onChange({ annee: Number(e.target.value), mois: valeur.mois, jour: null })}
        className="h-9 rounded-lg border border-ink-900/10 bg-surface px-2 text-sm"
      >
        {anneesDisponibles.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>

      <select
        value={valeur.mois ?? ""}
        onChange={(e) => onChange({ annee: valeur.annee, mois: e.target.value === "" ? null : Number(e.target.value), jour: null })}
        className="h-9 rounded-lg border border-ink-900/10 bg-surface px-2 text-sm"
      >
        <option value="">Tous les mois</option>
        {MOIS_LABELS.map((m, i) => <option key={m} value={i}>{m}</option>)}
      </select>

      <select
        value={valeur.jour ?? ""}
        onChange={(e) => onChange({ ...valeur, jour: e.target.value === "" ? null : Number(e.target.value) })}
        disabled={valeur.mois == null}
        className="h-9 rounded-lg border border-ink-900/10 bg-surface px-2 text-sm disabled:opacity-40"
      >
        <option value="">Tous les jours</option>
        {Array.from({ length: joursDansLeMois }, (_, i) => i + 1).map((j) => <option key={j} value={j}>{j}</option>)}
      </select>

      {(valeur.mois != null || valeur.jour != null) && (
        <button
          onClick={() => onChange({ annee: valeur.annee, mois: null, jour: null })}
          className="text-xs text-terracotta-600 underline"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}

export function correspondAuFiltre(dateIso: string, filtre: FiltreDateValeur): boolean {
  const d = new Date(dateIso);
  if (d.getFullYear() !== filtre.annee) return false;
  if (filtre.mois != null && d.getMonth() !== filtre.mois) return false;
  if (filtre.jour != null && d.getDate() !== filtre.jour) return false;
  return true;
}
