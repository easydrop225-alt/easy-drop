"use client";

import { useTransition } from "react";
import { validerCommercial, refuserCommercial } from "../actions";
import { Button } from "@/components/ui/button";

export function ValidationActions({ commercialId }: { commercialId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => { validerCommercial(commercialId); })}
      >
        Accepter
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() => startTransition(() => { refuserCommercial(commercialId); })}
      >
        Refuser
      </Button>
    </div>
  );
}
