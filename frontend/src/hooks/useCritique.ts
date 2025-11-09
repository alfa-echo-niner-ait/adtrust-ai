import { useState } from 'react';

export interface CritiqueInput {
  mediaUrl: string;
  brandColors: string;
  caption: string;
  mediaType?: string;
  sourceType?: string;
  sourceId?: string;
}

export interface CritiqueResult {
  BrandFit_Score: number;
  VisualQuality_Score: number;
  MessageClarity_Score?: number;
  ToneOfVoice_Score?: number;
  Safety_Score: number;
  BrandValidation?: {
    color_match_percentage: number;
    logo_present: boolean;
    logo_correct: boolean;
    overall_consistency: number;
  };
  SafetyBreakdown?: {
    harmful_content: number;
    stereotypes: number;
    misleading_claims: number;
  };
  Critique_Summary: string;
  Refinement_Prompt_Suggestion: string;
}

export function useCritique() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CritiqueResult | null>(null);

  const runCritique = async (input: CritiqueInput): Promise<string | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/critique/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaUrl: input.mediaUrl,
          brandColors: input.brandColors,
          caption: input.caption,
          mediaType: input.mediaType || 'image',
          sourceType: input.sourceType || 'manual',
          sourceId: input.sourceId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const critiqueData = await response.json();

      if (!critiqueData) {
        throw new Error('No data returned from critique function');
      }
      
      const result: CritiqueResult = {
        BrandFit_Score: critiqueData.BrandFit_Score,
        VisualQuality_Score: critiqueData.VisualQuality_Score,
        MessageClarity_Score: critiqueData.MessageClarity_Score,
        ToneOfVoice_Score: critiqueData.ToneOfVoice_Score,
        Safety_Score: critiqueData.Safety_Score,
        BrandValidation: critiqueData.BrandValidation,
        SafetyBreakdown: critiqueData.SafetyBreakdown,
        Critique_Summary: critiqueData.Critique_Summary,
        Refinement_Prompt_Suggestion: critiqueData.Refinement_Prompt_Suggestion,
      };

      setResult(result);

      return critiqueData.critiqueId || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during critique');
      return null;
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
