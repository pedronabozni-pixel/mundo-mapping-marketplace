import { IngredientPicker } from "@/components/kitchen/ingredient-picker";
import { SiteShell } from "@/components/kitchen/site-shell";

export default function SearchPage() {
  return (
    <SiteShell>
      <div className="grid gap-6">
        <section className="rounded-[36px] border border-white/80 bg-white p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.3)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Busca por ingredientes</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Monte sua geladeira e deixe o sistema sugerir as melhores combinações</h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            O foco aqui é utilidade: você informa o que possui, filtra por contexto e entende rapidamente o que pode cozinhar agora.
          </p>
        </section>
        <IngredientPicker compact />
      </div>
    </SiteShell>
  );
}
