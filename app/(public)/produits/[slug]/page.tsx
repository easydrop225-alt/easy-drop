import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Product, Media } from "@/types/database";

export default async function ProduitPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products_public")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!product) notFound();

  const { data: media } = await supabase
    .from("media")
    .select("*")
    .eq("product_id", (product as Product).id)
    .order("ordre");

  const images = ((media ?? []) as Media[]).filter((m) => m.type === "image");

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square rounded-2xl bg-beige-100">
          {images[0] ? (
            <Image src={images[0].url} alt={(product as Product).nom} fill sizes="(max-width: 768px) 100vw, 50vw" className="rounded-2xl object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-900/30">Photo à venir</div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold">{(product as Product).nom}</h1>
          <p className="mt-4 text-ink-900/70">{(product as Product).description}</p>
          <a
            href="/inscription"
            className="mt-6 inline-block rounded-xl bg-terracotta-500 px-6 py-3 font-medium text-white hover:bg-terracotta-600"
          >
            Je veux vendre ce produit
          </a>
        </div>
      </div>
    </main>
  );
}
