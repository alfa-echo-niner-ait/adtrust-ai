-- Add aspect_ratio column to generated_posters table
ALTER TABLE public.generated_posters 
ADD COLUMN aspect_ratio TEXT DEFAULT '1:1';

-- Add aspect_ratio column to generated_videos table
ALTER TABLE public.generated_videos 
ADD COLUMN aspect_ratio TEXT DEFAULT '16:9';

-- Add check constraints for valid aspect ratios
ALTER TABLE public.generated_posters
ADD CONSTRAINT valid_poster_aspect_ratio 
CHECK (aspect_ratio IN ('1:1', '3:4', '4:3', '9:16', '16:9'));

ALTER TABLE public.generated_videos
ADD CONSTRAINT valid_video_aspect_ratio 
CHECK (aspect_ratio IN ('9:16', '16:9'));