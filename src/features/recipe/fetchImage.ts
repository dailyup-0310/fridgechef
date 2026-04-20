const PEXELS_API = "https://api.pexels.com/v1/search";
const FALLBACK = "/images/recipe-placeholder.png";
const MIN_RESULTS_THRESHOLD = 5;

interface PexelsPhoto {
  src: { medium: string; large: string };
}
interface PexelsResponse {
  total_results: number;
  photos: PexelsPhoto[];
}

export async function fetchRecipeImage(query: string): Promise<string> {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query.trim()) return FALLBACK;

  try {
    const url = `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return FALLBACK;

    const data: PexelsResponse = await res.json();

    // Low total_results means poor keyword match — use fallback
    if (!data.total_results || data.total_results < MIN_RESULTS_THRESHOLD) return FALLBACK;

    return data.photos?.[0]?.src?.medium ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}
