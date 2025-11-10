-- Allow public delete on generated content tables so users can remove items from the UI
CREATE POLICY "Allow public delete access on generated_videos"
ON public.generated_videos
FOR DELETE
USING (true);

CREATE POLICY "Allow public delete access on generated_posters"
ON public.generated_posters
FOR DELETE
USING (true);

CREATE POLICY "Allow public delete access on critiques"
ON public.critiques
FOR DELETE
USING (true);

CREATE POLICY "Allow public delete access on workflow_runs"
ON public.workflow_runs
FOR DELETE
USING (true);