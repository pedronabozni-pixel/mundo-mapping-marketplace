export type PixelEvent = "ViewContent" | "AddToWishlist" | "InitiateCheckout" | "Lead";

export function trackPixelEvent(event: PixelEvent, payload?: Record<string, string | number>) {
  // Estrutura pronta para plugar Meta Pixel ou TikTok Pixel no futuro.
  if (process.env.NODE_ENV !== "production") {
    console.info("[pixel-placeholder]", event, payload ?? {});
  }
}
