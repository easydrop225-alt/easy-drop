const PALIERS = [1000, 500, 250, 100, 50, 10];

export function BadgesPerformance({
  commandesLivrees,
  estTopVendeurDuMois,
}: {
  commandesLivrees: number;
  estTopVendeurDuMois: boolean;
}) {
  const palierAtteint = PALIERS.find((p) => commandesLivrees >= p);
  const badges: { emoji: string; label: string }[] = [];

  if (estTopVendeurDuMois) badges.push({ emoji: "🏆", label: "Top vendeur du mois" });
  if (palierAtteint) badges.push({ emoji: "🎖️", label: `${palierAtteint} commandes livrées` });

  if (badges.length === 0) {
    return <p className="text-xs text-ink-900/40">Continue à vendre pour débloquer tes premiers badges !</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <span key={b.label} className="flex items-center gap-1.5 rounded-full bg-beige-100 px-3 py-1.5 text-xs font-medium">
          <span className="text-base">{b.emoji}</span> {b.label}
        </span>
      ))}
    </div>
  );
}
