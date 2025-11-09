-- Create table for generated posters/image ads
CREATE TABLE public.generated_posters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  prompt TEXT NOT NULL,
  brand_logo_url TEXT,
  product_image_url TEXT,
  poster_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  brand_colors TEXT,
  dimensions TEXT DEFAULT '1080x1080'
);

-- Enable Row Level Security
ALTER TABLE public.generated_posters ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on generated_posters"
ON public.generated_posters
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access on generated_posters"
ON public.generated_posters
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access on generated_posters"
ON public.generated_posters
FOR UPDATE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_generated_posters_updated_at
BEFORE UPDATE ON public.generated_posters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();