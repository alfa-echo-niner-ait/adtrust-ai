-- Add new scoring dimensions and validation data to critiques table
ALTER TABLE public.critiques
ADD COLUMN message_clarity_score numeric,
ADD COLUMN tone_of_voice_score numeric,
ADD COLUMN safety_breakdown jsonb,
ADD COLUMN brand_validation jsonb;

COMMENT ON COLUMN public.critiques.message_clarity_score IS 'Score (0-1) for message clarity - is the product obvious, is the tagline correct';
COMMENT ON COLUMN public.critiques.tone_of_voice_score IS 'Score (0-1) for tone of voice alignment with brand';
COMMENT ON COLUMN public.critiques.safety_breakdown IS 'Detailed safety analysis: harmful_content, stereotypes, misleading_claims';
COMMENT ON COLUMN public.critiques.brand_validation IS 'Brand consistency validation: color_match_percentage, logo_present, overall_consistency';