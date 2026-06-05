export type EmbedResult = {
  provider: "youtube" | "vimeo" | "unknown";
  embedUrl: string;
};

/**
 * Converte a URL de um vídeo (YouTube ou Vimeo) na URL de embed correspondente.
 * Retorna null quando a URL não é reconhecida.
 */
export function getEmbedUrl(videoUrl: string): EmbedResult | null {
  if (!videoUrl || typeof videoUrl !== "string") return null;
  const url = videoUrl.trim();
  if (!url) return null;

  // ── YouTube ───────────────────────────────────────────────────────────────
  // youtube.com/watch?v=ID · youtu.be/ID · youtube.com/embed/ID · youtube.com/shorts/ID
  const ytPatterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of ytPatterns) {
    const m = url.match(re);
    if (m?.[1]) {
      return {
        provider: "youtube",
        embedUrl: `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`,
      };
    }
  }

  // ── Vimeo ─────────────────────────────────────────────────────────────────
  // vimeo.com/ID · player.vimeo.com/video/ID · vimeo.com/channels/x/ID
  const vimeoPatterns = [
    /(?:player\.vimeo\.com\/video\/)(\d+)/,
    /(?:vimeo\.com\/(?:channels\/[\w-]+\/|groups\/[\w-]+\/videos\/|album\/\d+\/video\/)?)(\d+)/,
  ];
  for (const re of vimeoPatterns) {
    const m = url.match(re);
    if (m?.[1]) {
      return {
        provider: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${m[1]}`,
      };
    }
  }

  return null;
}
