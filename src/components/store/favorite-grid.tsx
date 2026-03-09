"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/store";
import { getFavorites } from "@/lib/favorites";
import { ProductCard } from "@/components/store/product-card";

export function FavoriteGrid({ products }: { products: Product[] }) {
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteSlugs(getFavorites());

    const onFocus = () => setFavoriteSlugs(getFavorites());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const favorites = useMemo(
    () => products.filter((product) => favoriteSlugs.includes(product.slug)),
    [favoriteSlugs, products]
  );

  if (!favorites.length) {
    return <p className="text-zinc-300">Você ainda não adicionou produtos aos favoritos.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {favorites.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
