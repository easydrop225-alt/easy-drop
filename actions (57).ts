"use client";

import { useTransition } from "react";
import { marquerToutesLues } from "./actions";
import { Button } from "@/components/ui/button";

export function MarquerToutesLuesButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="secondary" disabled={pending} onClick={() => startTransition(() => { marquerToutesLues(); })}>
      {pending ? "..." : "Tout marquer comme lu"}
    </Button>
  );
}
