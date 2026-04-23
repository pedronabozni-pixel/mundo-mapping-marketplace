import { Suspense } from "react";
import { RecipeDetailClient } from "@/components/kitchen/recipe-detail-client";
import { SiteShell } from "@/components/kitchen/site-shell";

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <SiteShell>
      <Suspense fallback={<div className="rounded-[28px] bg-white p-8 text-slate-600 shadow-sm">Carregando receita...</div>}>
        <RecipeDetailClient slug={slug} />
      </Suspense>
    </SiteShell>
  );
}
