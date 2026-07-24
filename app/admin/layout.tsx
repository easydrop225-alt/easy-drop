import { HeaderAdmin } from "@/components/shared/header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-beige-50">
      <HeaderAdmin />
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
