import { Suspense } from "react";
import { ResultsClient } from "@/components/kitchen/results-client";
import { SiteShell } from "@/components/kitchen/site-shell";

export default function ResultsPage() {
  return (
    <SiteShell>
      <Suspense fallback={<div className="rounded-[28px] bg-white p-8 text-slate-600 shadow-sm">Carregando resultados...</div>}>
        <ResultsClient />
      </Suspense>
    </SiteShell>
  );
}
