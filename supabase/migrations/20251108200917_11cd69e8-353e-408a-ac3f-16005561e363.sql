-- Create table for generated videos
CREATE TABLE public.generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  brand_logo_url TEXT,
  product_image_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for critiques
CREATE TABLE public.critiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  brand_colors TEXT NOT NULL,
  caption TEXT NOT NULL,
  brand_fit_score DECIMAL(3,2),
  visual_quality_score DECIMAL(3,2),
  safety_score DECIMAL(3,2),
  critique_summary TEXT,
  refinement_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.critiques ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this hackathon project)
CREATE POLICY "Allow public read access on generated_videos"
  ON public.generated_videos FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on generated_videos"
  ON public.generated_videos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on generated_videos"
  ON public.generated_videos FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access on critiques"
  ON public.critiques FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on critiques"
  ON public.critiques FOR INSERT
  WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_generated_videos_updated_at
  BEFORE UPDATE ON public.generated_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();