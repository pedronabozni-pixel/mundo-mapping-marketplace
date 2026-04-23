import Link from "next/link";
import { IngredientPicker } from "@/components/kitchen/ingredient-picker";

const steps = [
  {
    title: "Conte o que já tem",
    description: "Adicione ingredientes em poucos cliques com autocomplete, tags e atalhos populares."
  },
  {
    title: "Veja o que dá para fazer agora",
    description: "O motor prioriza receitas 100% compatíveis e mostra o que falta nas outras."
  },
  {
    title: "Decida sem perder tempo",
    description: "Escolha entre opções rápidas, econômicas, com pouca louça ou sem forno."
  }
];

const benefits = [
  "Evita desperdício usando primeiro ingredientes perecíveis",
  "Economiza tempo com sugestões organizadas por compatibilidade",
  "Ajuda iniciantes com receitas claras e passos curtos",
  "Mostra exatamente o que falta para completar a refeição"
];

export function HomePage() {
  return (
    <div className="grid gap-8">
      <section className="grid gap-6 rounded-[40px] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(247,252,249,0.82))] p-6 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.35)] ring-1 ring-white/70 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
        <div className="flex flex-col justify-center gap-6">
          <div className="inline-flex w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
            Food-tech para o dia a dia
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Descubra o que cozinhar com o que você já tem em casa.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Um assistente culinário inteligente para transformar geladeira, armário e sobras em refeições práticas, rápidas e sem desperdício.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white">
              <p className="text-3xl font-semibold">100%</p>
              <p className="mt-1 text-sm text-white/70">prioridade para receitas que já fecham com seus ingredientes</p>
            </div>
            <div className="rounded-[24px] bg-white px-5 py-4 shadow-sm">
              <p className="text-3xl font-semibold text-slate-900">+3</p>
              <p className="mt-1">ingredientes faltando no máximo para sugestões alternativas</p>
            </div>
            <div className="rounded-[24px] bg-white px-5 py-4 shadow-sm">
              <p className="text-3xl font-semibold text-slate-900">Rápido</p>
              <p className="mt-1">fluxo pensado para decidir em poucos segundos no mobile</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#0f172a,#1f4f46_55%,#f59e0b_180%)] p-6 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/70">Prioridade inteligente</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Veja primeiro o que já dá para cozinhar agora.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/78">
                O algoritmo considera ingredientes obrigatórios, tempo de preparo, pouca louça e itens perecíveis para evitar desperdício e acelerar sua escolha.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-[24px] bg-white/12 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-white/65">Exemplo</p>
                <p className="mt-2 text-lg font-medium">Você tem: ovo, arroz, tomate e queijo</p>
                <p className="mt-2 text-sm text-white/75">Sugestões imediatas: omelete prática, arroz com ovo e sanduíche quente.</p>
              </div>
              <Link
                href="/buscar"
                className="inline-flex min-h-12 items-center justify-center rounded-[20px] bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
              >
                Explorar busca completa
              </Link>
            </div>
          </div>
        </div>
      </section>

      <IngredientPicker />

      <section className="grid gap-5 lg:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-[30px] border border-white/80 bg-white/80 p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">{index + 1}</div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 rounded-[36px] border border-white/80 bg-white/80 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.3)] lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Benefícios do produto</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Clareza para decidir rápido, sem transformar sua cozinha em um problema.</h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
            O MVP foi desenhado para pessoas comuns: quem quer cozinhar em casa, economizar e aproveitar melhor o que comprou.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit} className="rounded-[26px] bg-[linear-gradient(180deg,#f8faf7,#eef4ef)] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg">✓</div>
              <p className="mt-4 text-base font-medium leading-7 text-slate-800">{benefit}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
