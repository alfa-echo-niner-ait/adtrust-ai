-- Add brand_colors column to generated_videos table
ALTER TABLE public.generated_videos
ADD COLUMN brand_colors text;

-- Add source tracking columns to critiques table
ALTER TABLE public.critiques
ADD COLUMN source_type text CHECK (source_type IN ('generated_video', 'generated_poster', 'manual')),
ADD COLUMN source_id uuid;