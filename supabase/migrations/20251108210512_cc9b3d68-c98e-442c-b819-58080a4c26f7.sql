-- Create storage bucket for video assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-assets', 'video-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for video assets bucket
CREATE POLICY "Anyone can view video assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'video-assets');

CREATE POLICY "Anyone can upload video assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'video-assets');