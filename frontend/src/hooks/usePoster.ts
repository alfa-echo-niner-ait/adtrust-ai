import { useState } from 'react';

export interface PosterInput {
  prompt: string;
  brandColors: string[];
  aspectRatio?: string;
  brandLogoUrl?: string | null;
  productImageUrl?: string | null;
}

export interface PosterResult {
  id: string;
  prompt: string;
  poster_url: string;
  created_at: string;
}

export function usePoster() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PosterResult | null>(null);

  const generatePoster = async (input: PosterInput): Promise<string | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/poster/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input.prompt,
          brandColors: input.brandColors,
          aspectRatio: input.aspectRatio || '1:1',
          brandLogoUrl: input.brandLogoUrl,
          productImageUrl: input.productImageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const posterData = await response.json();
      setResult(posterData);
      return posterData.id || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during poster generation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    generatePoster,
  };
}
