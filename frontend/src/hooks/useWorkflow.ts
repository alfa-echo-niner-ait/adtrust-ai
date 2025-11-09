import { useState } from 'react';

export interface WorkflowInput {
  prompt: string;
  brandColors: string[];
  brandName: string;
  brandLogoUrl?: string | null;
  productImageUrl?: string | null;
}

export interface WorkflowResult {
  workflow_id: string;
  poster_id: string;
  video_id: string;
  critique_id: string;
}

export function useWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WorkflowResult | null>(null);

  const runWorkflow = async (input: WorkflowInput): Promise<string | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/workflow/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input.prompt,
          brand_colors: input.brandColors,
          brand_name: input.brandName,
          brand_logo_url: input.brandLogoUrl,
          product_image_url: input.productImageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const workflowData = await response.json();
      setResult(workflowData);
      return workflowData.workflow_id || null;
    } catch (err)
    {
      setError(err instanceof Error ? err.message : 'An error occurred during workflow execution');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    runWorkflow,
  };
}
