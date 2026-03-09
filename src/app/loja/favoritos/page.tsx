import { FavoriteGrid } from "@/components/store/favorite-grid";
import { getProducts } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const products = await getProducts();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-4xl">Produtos Favoritos</h1>
        <p className="mt-2 text-zinc-300">Salvos no seu navegador via localStorage.</p>
      </div>
      <FavoriteGrid products={products} />
    </div>
  );
}
