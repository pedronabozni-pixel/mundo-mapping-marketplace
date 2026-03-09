export function StarRating({ rating, reviewsCount }: { rating: number; reviewsCount: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-300">
      <div className="flex text-amber-400" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index}>{index < Math.round(rating) ? "★" : "☆"}</span>
        ))}
      </div>
      <span>
        {rating.toFixed(1)} ({reviewsCount} avaliações)
      </span>
    </div>
  );
}
