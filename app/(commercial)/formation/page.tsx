import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { urlEmbedVideo } from "@/lib/video-embed";
import type { Formation } from "@/types/database";

export default async function FormationCommercialPage() {
  const supabase = await createClient();
  const { data: formations } = await supabase
    .from("formations")
    .select("*")
    .eq("actif", true)
    .order("ordre");

  const list = (formations ?? []) as Formation[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">🎓 Espace formation</h1>
        <p className="text-sm text-ink-900/60">Quelques vidéos courtes pour t'aider à mieux vendre sur Easy Drop.</p>
      </div>

      <div className="space-y-6">
        {list.map((f) => (
          <Card key={f.id} className="space-y-2 p-0 overflow-hidden">
            <div className="aspect-video w-full bg-ink-900">
              <iframe
                src={urlEmbedVideo(f.video_url)}
                title={f.titre}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <div className="p-4">
              <p className="font-medium">{f.titre}</p>
              {f.description && <p className="mt-1 text-sm text-ink-900/60">{f.description}</p>}
            </div>
          </Card>
        ))}
        {list.length === 0 && (
          <Card><p className="text-center text-sm text-ink-900/40">Aucune vidéo de formation pour l'instant — reviens bientôt !</p></Card>
        )}
      </div>
    </div>
  );
}
