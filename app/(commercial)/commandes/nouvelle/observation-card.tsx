"use client";

import { Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function ObservationCard({
  observation,
  onObservationChange,
}: {
  observation: string;
  onObservationChange: (v: string) => void;
}) {
  return (
    <Card>
      <Label htmlFor="observation">Observation (précisions supplémentaires)</Label>
      <textarea
        id="observation"
        name="observation"
        rows={2}
        value={observation}
        onChange={(e) => onObservationChange(e.target.value)}
        placeholder="Ex : préférence du client, remarque particulière, heure de livraison souhaitée..."
        className="w-full rounded-xl border border-ink-900/10 bg-surface p-3 text-sm"
      />
    </Card>
  );
}
