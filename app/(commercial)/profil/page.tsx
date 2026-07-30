import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { AvatarUploader } from "@/components/produits/avatar-uploader";
import { BadgesPerformance } from "@/components/produits/badges-performance";
import { TelephoneForm } from "./telephone-form";
import { BoutiqueForm } from "./boutique-form";
import { LogoutButton } from "@/components/shared/logout-button";
import type { Profile, Setting } from "@/types/database";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
  const p = profile as Profile | null;

  const { count: commandesLivrees } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("commercial_id", user?.id ?? "")
    .eq("statut", "livree");

  const { data: rangDuMois } = await supabase.rpc("mon_rang_du_mois");

  const { data: settingsData } = await supabase.from("settings").select("*").eq("cle", "whatsapp_communaute_lien").maybeSingle();
  const lienCommunaute = (settingsData as Setting | null)?.valeur as string | undefined;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="mb-2 text-2xl font-semibold">Mon profil</h1>
      <Card>
        {user?.id && <AvatarUploader userId={user.id} photoUrl={p?.photo_url ?? null} />}
      </Card>
      <Card>
        <h2 className="mb-2 text-sm font-medium text-ink-900/60">Mes badges</h2>
        <BadgesPerformance
          commandesLivrees={commandesLivrees ?? 0}
          estTopVendeurDuMois={rangDuMois === 1}
        />
      </Card>
      <Card className="space-y-3 text-sm">
        <p><span className="text-ink-900/50">Nom : </span>{p?.prenom} {p?.nom}</p>
        {p && <BoutiqueForm nomActuel={p.nom_boutique} derniereModification={p.nom_boutique_modifie_le} />}
        {p && <TelephoneForm telephoneActuel={p.telephone} derniereModification={p.telephone_modifie_le} />}
        <p><span className="text-ink-900/50">Email : </span>{p?.email ?? "—"}</p>
        <p><span className="text-ink-900/50">Statut : </span>{p?.statut}</p>
      </Card>

      <a
        href="/parrainage"
        className="flex items-center justify-center gap-2 rounded-xl bg-terracotta-500 px-4 py-3 text-sm font-medium text-white hover:bg-terracotta-600"
      >
        🤝 Mon Parrainage
      </a>

      <a
        href="/formation"
        className="flex items-center justify-center gap-2 rounded-xl bg-terracotta-500 px-4 py-3 text-sm font-medium text-white hover:bg-terracotta-600"
      >
        🎓 Espace formation
      </a>

      {lienCommunaute && (
        <a
          href={lienCommunaute}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          📢 Rejoindre la communauté Easy Drop
        </a>
      )}

      <a
        href="https://wa.me/2250143086228"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"
      >
        💬 Contacter le service client (WhatsApp)
      </a>

      <a
        href="/a-propos"
        className="flex items-center justify-center gap-2 rounded-xl bg-gray-500 px-4 py-3 text-sm font-medium text-white hover:bg-gray-600"
      >
        ℹ️ À propos d'Easy Drop
      </a>
      <div className="flex justify-center md:hidden"><LogoutButton /></div>
    </div>
  );
}
