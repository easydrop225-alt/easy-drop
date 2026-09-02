import Link from "next/link";
import Image from "next/image";
import { FormulaireConnexion } from "./formulaire-connexion";

export default function ConnexionPage() {
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
        <h1 className="text-2xl font-semibold">Connexion</h1>
      </div>
      <FormulaireConnexion />
      <p className="mt-6 text-sm text-ink-900/60">
        Pas encore de compte ? <Link href="/inscription" className="text-terracotta-600 underline">S'inscrire</Link>
      </p>
    </main>
  );
}
