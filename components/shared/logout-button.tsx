"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm text-ink-900/60 hover:text-ink-900"
      title="Se déconnecter"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">Déconnexion</span>
    </button>
  );
}
