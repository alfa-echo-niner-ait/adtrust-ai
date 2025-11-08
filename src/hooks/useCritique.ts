import { useState } from 'react';

export interface CritiqueInput {
  mediaUrl: string;
  brandColors: string;
  caption: string;
}

export interface CritiqueResult {
  BrandFit_Score: number;
  VisualQuality_Score: number;
  Safety_Score: number;
  Critique_Summary: string;
  Refinement_Prompt_Suggestion: string;
}

export function useCritique() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CritiqueResult | null>(null);

  const runCritique = async (input: CritiqueInput) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock response - in production, this would call your AI API
      const mockResult: CritiqueResult = {
        BrandFit_Score: 0.85,
        VisualQuality_Score: 0.92,
        Safety_Score: 0.78,
        Critique_Summary: `The ad demonstrates strong visual quality with professional composition and clear messaging. Brand colors (${input.brandColors}) are partially present but could be more prominent. The safety review flagged minor concerns regarding claim substantiation. Overall, the ad aligns well with brand guidelines but requires refinement before deployment.`,
        Refinement_Prompt_Suggestion: `Create a high-quality advertisement featuring [product/service] with dominant use of brand color ${input.brandColors}. Ensure the brand logo is prominently displayed in the top-right corner. The visual should convey [key message from caption] while maintaining a professional, trustworthy aesthetic. Include clear product benefits without making unsubstantiated claims. Lighting should be bright and inviting. Composition should follow the rule of thirds with the product as the focal point.`,
      };

      setResult(mockResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during critique');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    runCritique,
  };
}
