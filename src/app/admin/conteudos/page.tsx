import { revalidatePath } from "next/cache";
import { AnalysisCategory, VideoProvider } from "@prisma/client";
import { requireAdminSession } from "@/lib/access";
import { db } from "@/lib/db";
import { saveImageUpload } from "@/lib/uploads";
import { slugify } from "@/lib/utils";

function formatDateTimeLocal(date: Date | null) {
  if (!date) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function revalidateContentPaths() {
  revalidatePath("/admin/conteudos");
  revalidatePath("/app/atualizacoes");
  revalidatePath("/app/analises");
  revalidatePath("/app/videos");
}

async function createUpdate(formData: FormData) {
  "use server";
  const session = await requireAdminSession();

  const title = String(formData.get("title") ?? "");
  const content = String(formData.get("content") ?? "");
  const coverImageFile = formData.get("coverImageFile");
  if (!title || !content) return;

  const coverImage =
    coverImageFile instanceof File ? await saveImageUpload(coverImageFile, "updates") : null;

  await db.dailyUpdate.create({
    data: {
      title,
      slug: `${slugify(title)}-${Date.now()}`,
      content,
      coverImage,
      publishedAt: new Date(String(formData.get("publishedAt") || new Date().toISOString())),
      createdById: session.user.id
    }
  });

  revalidateContentPaths();
}

async function createAnalysis(formData: FormData) {
  "use server";
  const session = await requireAdminSession();

  const title = String(formData.get("title") ?? "");
  const content = String(formData.get("content") ?? "");
  const coverImageFile = formData.get("coverImageFile");
  const category = String(formData.get("category") ?? "MACRO") as AnalysisCategory;
  if (!title || !content) return;

  const coverImage =
    coverImageFile instanceof File ? await saveImageUpload(coverImageFile, "analyses") : null;

  await db.analysis.create({
    data: {
      title,
      slug: `${slugify(title)}-${Date.now()}`,
      category,
      content,
      coverImage,
      pdfUrl: String(formData.get("pdfUrl") ?? "") || null,
      publishedAt: new Date(String(formData.get("publishedAt") || new Date().toISOString())),
      createdById: session.user.id
    }
  });

  revalidateContentPaths();
}

async function createVideo(formData: FormData) {
  "use server";
  const session = await requireAdminSession();

  const title = String(formData.get("title") ?? "");
  const module = String(formData.get("module") ?? "base");
  const videoUrl = String(formData.get("videoUrl") ?? "");
  const provider = String(formData.get("provider") ?? "YOUTUBE") as VideoProvider;
  const requiredPlanId = String(formData.get("requiredPlanId") ?? "") || null;

  if (!title || !videoUrl) return;

  await db.video.create({
    data: {
      title,
      module,
      videoUrl,
      provider,
      requiredPlanId,
      publishedAt: new Date(String(formData.get("publishedAt") || new Date().toISOString())),
      createdById: session.user.id
    }
  });

  revalidateContentPaths();
}

async function updateUpdate(formData: FormData) {
  "use server";
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const content = String(formData.get("content") ?? "");
  const coverImageFile = formData.get("coverImageFile");
  const currentCoverImage = String(formData.get("currentCoverImage") ?? "") || null;

  if (!id || !title || !content) return;

  const coverImage =
    coverImageFile instanceof File && coverImageFile.size > 0
      ? await saveImageUpload(coverImageFile, "updates")
      : currentCoverImage;

  await db.dailyUpdate.update({
    where: { id },
    data: {
      title,
      content,
      coverImage,
      publishedAt: new Date(String(formData.get("publishedAt") || new Date().toISOString()))
    }
  });

  revalidateContentPaths();
}

async function updateAnalysis(formData: FormData) {
  "use server";
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const content = String(formData.get("content") ?? "");
  const coverImageFile = formData.get("coverImageFile");
  const currentCoverImage = String(formData.get("currentCoverImage") ?? "") || null;
  const category = String(formData.get("category") ?? "MACRO") as AnalysisCategory;

  if (!id || !title || !content) return;

  const coverImage =
    coverImageFile instanceof File && coverImageFile.size > 0
      ? await saveImageUpload(coverImageFile, "analyses")
      : currentCoverImage;

  await db.analysis.update({
    where: { id },
    data: {
      title,
      category,
      content,
      coverImage,
      pdfUrl: String(formData.get("pdfUrl") ?? "") || null,
      publishedAt: new Date(String(formData.get("publishedAt") || new Date().toISOString()))
    }
  });

  revalidateContentPaths();
}

async function updateVideo(formData: FormData) {
  "use server";
  await requireAdminSession();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const module = String(formData.get("module") ?? "base");
  const videoUrl = String(formData.get("videoUrl") ?? "");
  const provider = String(formData.get("provider") ?? "YOUTUBE") as VideoProvider;
  const requiredPlanId = String(formData.get("requiredPlanId") ?? "") || null;

  if (!id || !title || !videoUrl) return;

  await db.video.update({
    where: { id },
    data: {
      title,
      module,
      videoUrl,
      provider,
      requiredPlanId,
      publishedAt: new Date(String(formData.get("publishedAt") || new Date().toISOString()))
    }
  });

  revalidateContentPaths();
}

async function deleteContent(formData: FormData) {
  "use server";
  await requireAdminSession();

  const type = String(formData.get("type") ?? "");
  const id = String(formData.get("id") ?? "");

  if (!id || !type) return;

  if (type === "update") await db.dailyUpdate.delete({ where: { id } });
  if (type === "analysis") await db.analysis.delete({ where: { id } });
  if (type === "video") await db.video.delete({ where: { id } });

  revalidateContentPaths();
}

export default async function AdminContentsPage() {
  await requireAdminSession();

  const [updates, analyses, videos, plans] = await Promise.all([
    db.dailyUpdate.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.analysis.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.video.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.plan.findMany({ where: { isActive: true } })
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestão de Conteúdos</h1>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Nova atualização diária</h2>
        <form action={createUpdate} className="grid gap-2">
          <input className="input" name="title" placeholder="Título" required />
          <textarea className="input min-h-28" name="content" placeholder="Conteúdo educacional" required />
          <label className="drop-input">
            <span className="text-sm font-medium">Adicionar imagem de capa</span>
            <span className="text-xs text-muted">Arraste a imagem aqui ou clique para selecionar</span>
            <input accept="image/*" className="mt-2 block text-sm text-muted" name="coverImageFile" type="file" />
          </label>
          <input className="input" name="publishedAt" type="datetime-local" />
          <button className="btn" type="submit">
            Publicar atualização
          </button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Nova análise</h2>
        <form action={createAnalysis} className="grid gap-2">
          <input className="input" name="title" placeholder="Título" required />
          <select className="input" name="category">
            <option value="MACRO">Macro</option>
            <option value="TECNICA">Técnica</option>
            <option value="NARRATIVAS">Narrativas</option>
            <option value="INSTITUCIONAL">Institucional</option>
            <option value="EUA">EUA</option>
          </select>
          <textarea className="input min-h-28" name="content" placeholder="Corpo da análise" required />
          <label className="drop-input">
            <span className="text-sm font-medium">Adicionar imagem de capa</span>
            <span className="text-xs text-muted">Arraste a imagem aqui ou clique para selecionar</span>
            <input accept="image/*" className="mt-2 block text-sm text-muted" name="coverImageFile" type="file" />
          </label>
          <input className="input" name="pdfUrl" placeholder="URL PDF (opcional)" />
          <input className="input" name="publishedAt" type="datetime-local" />
          <button className="btn" type="submit">
            Publicar análise
          </button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Novo vídeo</h2>
        <form action={createVideo} className="grid gap-2">
          <input className="input" name="title" placeholder="Título" required />
          <input className="input" name="module" placeholder="Módulo (ex: base)" required />
          <select className="input" name="provider">
            <option value="YOUTUBE">YouTube</option>
            <option value="VIMEO">Vimeo</option>
          </select>
          <input className="input" name="videoUrl" placeholder="URL embed" required />
          <select className="input" name="requiredPlanId">
            <option value="">Sem restrição</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          <input className="input" name="publishedAt" type="datetime-local" />
          <button className="btn" type="submit">
            Publicar vídeo
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">Editar conteúdos publicados</h2>
        <p className="mb-4 text-sm text-muted">
          Clique em <span className="font-semibold text-text">Editar</span> no conteúdo que quiser alterar.
        </p>

        <div className="space-y-4">
          {updates.map((item) => (
            <details className="rounded border border-border p-4" key={item.id}>
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
                <span>ATUALIZAÇÃO • {item.title}</span>
                <span className="rounded-full border border-brand/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand">
                  Editar
                </span>
              </summary>
              <form action={updateUpdate} className="mt-4 grid gap-2">
                <input name="id" type="hidden" value={item.id} />
                <input name="currentCoverImage" type="hidden" value={item.coverImage ?? ""} />
                <input className="input" defaultValue={item.title} name="title" placeholder="Título" required />
                <textarea className="input min-h-28" defaultValue={item.content} name="content" placeholder="Conteúdo educacional" required />
                {item.coverImage ? (
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">Imagem atual</span>
                    <img alt={item.title} className="max-h-52 w-full rounded-lg object-cover" src={item.coverImage} />
                  </div>
                ) : null}
                <label className="drop-input">
                  <span className="text-sm font-medium">Trocar imagem de capa</span>
                  <span className="text-xs text-muted">
                    {item.coverImage ? "Se não enviar nova imagem, a atual será mantida." : "Envie uma imagem se quiser adicionar capa."}
                  </span>
                  <input accept="image/*" className="mt-2 block text-sm text-muted" name="coverImageFile" type="file" />
                </label>
                <input className="input" defaultValue={formatDateTimeLocal(item.publishedAt)} name="publishedAt" type="datetime-local" />
                <div className="flex gap-2">
                  <button className="btn" type="submit">
                    Salvar edição
                  </button>
                </div>
              </form>
            </details>
          ))}

          {analyses.map((item) => (
            <details className="rounded border border-border p-4" key={item.id}>
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
                <span>ANÁLISE • {item.title}</span>
                <span className="rounded-full border border-brand/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand">
                  Editar
                </span>
              </summary>
              <form action={updateAnalysis} className="mt-4 grid gap-2">
                <input name="id" type="hidden" value={item.id} />
                <input name="currentCoverImage" type="hidden" value={item.coverImage ?? ""} />
                <input className="input" defaultValue={item.title} name="title" placeholder="Título" required />
                <select className="input" defaultValue={item.category} name="category">
                  <option value="MACRO">Macro</option>
                  <option value="TECNICA">Técnica</option>
                  <option value="NARRATIVAS">Narrativas</option>
                  <option value="INSTITUCIONAL">Institucional</option>
                  <option value="EUA">EUA</option>
                </select>
                <textarea className="input min-h-28" defaultValue={item.content} name="content" placeholder="Corpo da análise" required />
                {item.coverImage ? (
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">Imagem atual</span>
                    <img alt={item.title} className="max-h-52 w-full rounded-lg object-cover" src={item.coverImage} />
                  </div>
                ) : null}
                <label className="drop-input">
                  <span className="text-sm font-medium">Trocar imagem de capa</span>
                  <span className="text-xs text-muted">
                    {item.coverImage ? "Se não enviar nova imagem, a atual será mantida." : "Envie uma imagem se quiser adicionar capa."}
                  </span>
                  <input accept="image/*" className="mt-2 block text-sm text-muted" name="coverImageFile" type="file" />
                </label>
                <input className="input" defaultValue={item.pdfUrl ?? ""} name="pdfUrl" placeholder="URL PDF (opcional)" />
                <input className="input" defaultValue={formatDateTimeLocal(item.publishedAt)} name="publishedAt" type="datetime-local" />
                <div className="flex gap-2">
                  <button className="btn" type="submit">
                    Salvar edição
                  </button>
                </div>
              </form>
            </details>
          ))}

          {videos.map((item) => (
            <details className="rounded border border-border p-4" key={item.id}>
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
                <span>VÍDEO • {item.title}</span>
                <span className="rounded-full border border-brand/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-brand">
                  Editar
                </span>
              </summary>
              <form action={updateVideo} className="mt-4 grid gap-2">
                <input name="id" type="hidden" value={item.id} />
                <input className="input" defaultValue={item.title} name="title" placeholder="Título" required />
                <input className="input" defaultValue={item.module} name="module" placeholder="Módulo" required />
                <select className="input" defaultValue={item.provider} name="provider">
                  <option value="YOUTUBE">YouTube</option>
                  <option value="VIMEO">Vimeo</option>
                </select>
                <input className="input" defaultValue={item.videoUrl} name="videoUrl" placeholder="URL embed" required />
                <select className="input" defaultValue={item.requiredPlanId ?? ""} name="requiredPlanId">
                  <option value="">Sem restrição</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                <input className="input" defaultValue={formatDateTimeLocal(item.publishedAt)} name="publishedAt" type="datetime-local" />
                <div className="flex gap-2">
                  <button className="btn" type="submit">
                    Salvar edição
                  </button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">Excluir conteúdos</h2>
        <div className="space-y-2 text-sm">
          {[...updates.map((item) => ({ type: "update", id: item.id, title: item.title })), ...analyses.map((item) => ({ type: "analysis", id: item.id, title: item.title })), ...videos.map((item) => ({ type: "video", id: item.id, title: item.title }))].map((item) => (
            <form action={deleteContent} className="flex items-center justify-between gap-2 rounded border border-border p-2" key={item.id}>
              <span>{item.type.toUpperCase()} • {item.title}</span>
              <input name="type" type="hidden" value={item.type} />
              <input name="id" type="hidden" value={item.id} />
              <button className="btn-secondary" type="submit">Excluir</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
