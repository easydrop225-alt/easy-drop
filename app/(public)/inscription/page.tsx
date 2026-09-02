import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { FormulaireInscription } from "./formulaire-inscription";

export default function InscriptionPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/logo-easy-drop.png"
          alt="Easy Drop"
          width={64}
          height={64}
          priority
          className="mb-4 h-16 w-16 rounded-2xl object-contain"
        />
        <h1 className="text-2xl font-semibold">S&apos;inscrire sur Easy Drop</h1>
        <p className="mt-2 text-sm text-ink-900/60">
          Crée ton compte pour accéder immédiatement au catalogue et commencer à vendre — sans stock, sans avance de frais.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-ink-900/40">Chargement...</p>}>
        <FormulaireInscription />
      </Suspense>
      <p className="mt-6 text-center text-sm text-ink-900/60">
        Déjà un compte ? <Link href="/connexion" className="font-medium text-terracotta-600 underline">Se connecter</Link>
      </p>
    </main>
  );
}
