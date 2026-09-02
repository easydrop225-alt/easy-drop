import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import { niveauPourVentes, prochainNiveau, calculerBonusParrainage, premierJourDuMois, GRILLE_PARRAINAGE } from "@/lib/parrainage";
import { CopierLienBouton } from "./copier-lien-bouton";
import type { Profile, VersementParrainage } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mon parrainage" };


export default async function ParrainagePage() {
  const supabase = await createClient();
  // getSession() lit la session depuis le cookie, sans appel réseau
  // systématique vers Supabase à chaque affichage de page (contrairement
  // à getUser()) — l'id récupéré ici ne sert qu'à filtrer les propres
  // données de la personne, déjà protégées indépendamment par les
  // policies RLS de la base de données.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id ?? "").single();
  const p = profile as Profile | null;

  const debutMois = premierJourDuMois(new Date());
  const finMois = new Date(); finMois.setDate(finMois.getDate() + 1);

  const [{ data: filleuls }, { data: mesVentesLivrees }, { data: pointsCeMois }, { data: versements }] = await Promise.all([
    supabase.from("profiles").select("id, prenom, nom, nom_boutique").eq("parrain_id", user?.id ?? ""),
    supabase.from("orders").select("id").eq("commercial_id", user?.id ?? "").eq("statut", "livree").gte("created_at", debutMois),
    supabase.from("points_parrainage").select("id, filleul_id").eq("parrain_id", user?.id ?? "").gte("created_at", debutMois),
    supabase.from("versements_parrainage").select("*").eq("parrain_id", user?.id ?? "").order("mois", { ascending: false }),
  ]);

  const filleulsList = filleuls ?? [];
  const ventesPersonnellesCeMois = mesVentesLivrees?.length ?? 0;
  const nombrePoints = pointsCeMois?.length ?? 0;
  const filleulsActifsIds = new Set((pointsCeMois ?? []).map((pt) => pt.filleul_id));

  const { niveau, valeurPoint, montant } = calculerBonusParrainage(nombrePoints, ventesPersonnellesCeMois);
  const suivant = prochainNiveau(ventesPersonnellesCeMois);
  const actuel = niveauPourVentes(ventesPersonnellesCeMois);

  const progressionPct = suivant
    ? Math.min(100, Math.round(((ventesPersonnellesCeMois - actuel.min) / (suivant.min - actuel.min)) * 100))
    : 100;

  const lienParrainage = p?.code_parrainage
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/inscription?ref=${p.code_parrainage}`
    : "";

  const versementsList = (versements ?? []) as VersementParrainage[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">🤝 Mon Parrainage</h1>
        <p className="text-sm text-ink-900/60">Invite d'autres commerciaux et gagne un bonus sur leurs ventes, en plus des tiennes.</p>
      </div>

      <Card className="space-y-3">
        <div>
          <p className="text-xs text-ink-900/50">Mon code de parrainage</p>
          <p className="text-xl font-bold tracking-wide">{p?.code_parrainage ?? "—"}</p>
        </div>
        <div>
          <p className="mb-1 text-xs text-ink-900/50">Mon lien de parrainage</p>
          <div className="flex items-center gap-2">
            <input readOnly value={lienParrainage} className="flex-1 rounded-lg border border-ink-900/10 bg-beige-50 px-2 py-1.5 text-xs" />
            <CopierLienBouton lien={lienParrainage} />
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Salut ! Rejoins Easy Drop, la plateforme qui permet de vendre des produits sans acheter de stock — inscription gratuite avec mon lien : ${lienParrainage}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            📲 Partager mon lien sur WhatsApp
          </a>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardTitle>Filleuls</CardTitle><CardValue>{filleulsList.length}</CardValue></Card>
        <Card><CardTitle>Filleuls actifs ce mois</CardTitle><CardValue>{filleulsActifsIds.size}</CardValue></Card>
        <Card><CardTitle>Points ce mois</CardTitle><CardValue>{nombrePoints}</CardValue></Card>
        <Card><CardTitle>Bonus estimé ce mois</CardTitle><CardValue className="text-terracotta-600">{formatFCFA(montant)}</CardValue></Card>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-900/60">Vous êtes actuellement</span>
          <span className="rounded-full bg-terracotta-500 px-3 py-1 text-sm font-semibold text-white">Niveau {niveau}</span>
        </div>
        <p className="text-sm text-ink-900/60">{valeurPoint} FCFA / point — {ventesPersonnellesCeMois} vente(s) personnelle(s) ce mois</p>
        {suivant ? (
          <div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-beige-100">
              <div className="h-full rounded-full bg-terracotta-500" style={{ width: `${progressionPct}%` }} />
            </div>
            <p className="mt-1 text-xs text-ink-900/50">
              Encore {Math.max(0, suivant.min - ventesPersonnellesCeMois)} vente(s) pour passer à {suivant.valeurPoint} FCFA/point ({suivant.niveau})
            </p>
          </div>
        ) : (
          <p className="text-xs text-emerald-600">🏆 Niveau maximum atteint !</p>
        )}
      </Card>

      <details className="group rounded-2xl border border-ink-900/5 bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium text-terracotta-600 group-open:mb-3">
          📊 Consulter tous les niveaux et leurs bénéfices
        </summary>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-2">Niveau</th>
              <th className="p-2">Ventes personnelles requises</th>
              <th className="p-2">Valeur du point</th>
            </tr>
          </thead>
          <tbody>
            {GRILLE_PARRAINAGE.map((palier) => (
              <tr
                key={palier.niveau}
                className={`border-b border-ink-900/5 last:border-0 ${palier.niveau === niveau ? "bg-terracotta-50 font-medium" : ""}`}
              >
                <td className="p-2">{palier.niveau} {palier.niveau === niveau && "← toi"}</td>
                <td className="p-2">{palier.max ? `${palier.min} à ${palier.max}` : `${palier.min}+`}</td>
                <td className="p-2">{formatFCFA(palier.valeurPoint)} / point</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-ink-900/40">
          Le niveau est recalculé chaque mois selon tes propres ventes livrées — plus tu vends personnellement, plus tes points de parrainage valent cher.
        </p>
      </details>

      <div>
        <h2 className="mb-2 text-sm font-medium text-ink-900/60">Mes filleuls ({filleulsList.length})</h2>
        <Card className="p-0">
          {filleulsList.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-900/40">Aucun filleul pour l'instant — partage ton lien !</p>
          ) : (
            <ul className="divide-y divide-ink-900/5">
              {filleulsList.map((f) => (
                <li key={f.id} className="flex items-center justify-between p-3 text-sm">
                  <span>{f.prenom} {f.nom} {f.nom_boutique && <span className="text-ink-900/40">— {f.nom_boutique}</span>}</span>
                  {filleulsActifsIds.has(f.id) && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Actif ce mois</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-ink-900/60">Historique des gains de parrainage</h2>
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                <th className="p-3">Mois</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {versementsList.map((v) => (
                <tr key={v.id} className="border-b border-ink-900/5 last:border-0">
                  <td className="p-3">{new Date(v.mois).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</td>
                  <td className="p-3">{formatFCFA(v.montant)}</td>
                  <td className="p-3"><span className="font-medium text-emerald-600">✓ Payé le {formatDate(v.created_at)}</span></td>
                </tr>
              ))}
              {versementsList.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-ink-900/40">Aucun versement de parrainage pour l'instant.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
