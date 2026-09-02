"use client";

import { ErrorBoundaryContent } from "@/components/shared/error-boundary-content";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryContent error={error} reset={reset} />;
}
