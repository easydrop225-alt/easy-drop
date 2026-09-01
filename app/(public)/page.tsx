import { redirect } from "next/navigation";

// L'accueil public ne présente plus de vitrine catalogue : le visiteur est
// amené directement vers le formulaire de création de compte (voir
// app/(public)/inscription/page.tsx pour la structure logo + formulaire).
export default function HomePage() {
  redirect("/inscription");
}
