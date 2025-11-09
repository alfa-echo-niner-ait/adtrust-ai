import { useState } from 'react';

export interface VideoInput {
  prompt: string;
  brandName: string;
  aspectRatio?: string;
}

export interface VideoResult {
  id: string;
  prompt: string;
  video_url: string;
  created_at: string;
}

export function useVideo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);

  const generateVideo = async (input: VideoInput): Promise<string | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input.prompt,
          brand_name: input.brandName,
          aspect_ratio: input.aspectRatio || '16:9',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const videoData = await response.json();
      setResult(videoData);
      return videoData.id || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during video generation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    generateVideo,
  };
}
