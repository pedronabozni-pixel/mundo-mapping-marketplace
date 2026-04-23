"use client";

import Link from "next/link";
import { useKitchen } from "@/components/kitchen/kitchen-provider";

export function FavoritesPage() {
  const { recipes, favoriteIds, ready } = useKitchen();
  const favoriteRecipes = recipes.filter((recipe) => favoriteIds.includes(recipe.id));

  if (!ready) {
    return <div className="rounded-[28px] bg-white p-8 text-slate-600 shadow-sm">Carregando favoritos...</div>;
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[36px] border border-white/80 bg-white p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.3)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Favoritos</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Base pronta para autenticação e preferências pessoais</h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
          Neste MVP, os favoritos ficam salvos localmente. Depois, basta trocar a persistência por login + banco para sincronizar entre dispositivos.
        </p>
      </section>

      {favoriteRecipes.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-slate-300 bg-white/75 p-10 text-center">
          <p className="text-lg font-medium text-slate-800">Nenhuma receita salva ainda.</p>
          <p className="mt-2 text-sm text-slate-600">Abra uma receita e use o botão de favoritos para começar sua coleção.</p>
          <Link href="/buscar" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[18px] bg-slate-900 px-5 text-sm font-semibold text-white">
            Buscar receitas
          </Link>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {favoriteRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/receitas/${recipe.slug}`} className="overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
              <div className="aspect-[16/11]">
                <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">{recipe.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{recipe.description}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
