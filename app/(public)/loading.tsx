import { PageSkeletonSimple } from "@/components/shared/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <PageSkeletonSimple />
    </main>
  );
}
