import { db } from "@/lib/db";
import { requireMemberSession } from "@/lib/access";

export default async function VideosPage() {
  await requireMemberSession();

  const videos = await db.video.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ module: "asc" }, { publishedAt: "desc" }],
    include: { requiredPlan: true }
  });

  const grouped = videos.reduce<Record<string, typeof videos>>((acc, item) => {
    acc[item.module] = acc[item.module] ? [...acc[item.module], item] : [item];
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vídeos</h1>

      {Object.entries(grouped).map(([module, moduleVideos]) => (
        <section className="card space-y-3" key={module}>
          <h2 className="text-lg font-semibold">Módulo: {module}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {moduleVideos.map((video) => (
              <article className="space-y-2" key={video.id}>
                <h3 className="font-semibold">{video.title}</h3>
                <iframe
                  allow="autoplay; encrypted-media; picture-in-picture"
                  className="aspect-video w-full rounded-lg border border-border"
                  src={video.videoUrl}
                  title={video.title}
                />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
