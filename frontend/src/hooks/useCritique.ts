import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      // Call the Google Gemini API through edge function
      const { data: critiqueData, error: functionError } = await supabase.functions.invoke(
        'critique-with-google',
        {
          body: {
            mediaUrl: input.mediaUrl,
            brandColors: input.brandColors,
            caption: input.caption,
            mediaType: input.mediaType || 'image'
          }
        }
      );

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(`Failed to run critique: ${functionError.message}`);
      }

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

      // Save to database
      const { data, error: dbError } = await supabase
        .from('critiques')
        .insert({
          media_url: input.mediaUrl,
          media_type: input.mediaType || 'image',
          brand_colors: input.brandColors,
          caption: input.caption,
          brand_fit_score: result.BrandFit_Score,
          visual_quality_score: result.VisualQuality_Score,
          message_clarity_score: result.MessageClarity_Score,
          tone_of_voice_score: result.ToneOfVoice_Score,
          safety_score: result.Safety_Score,
          brand_validation: result.BrandValidation,
          safety_breakdown: result.SafetyBreakdown,
          critique_summary: result.Critique_Summary,
          refinement_prompt: result.Refinement_Prompt_Suggestion,
          source_type: input.sourceType || 'manual',
          source_id: input.sourceId || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return data?.id || null;
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
