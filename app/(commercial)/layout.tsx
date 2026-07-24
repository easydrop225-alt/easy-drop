import { HeaderCommercial } from "@/components/shared/header";

export default function CommercialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-beige-50">
      <HeaderCommercial />
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
