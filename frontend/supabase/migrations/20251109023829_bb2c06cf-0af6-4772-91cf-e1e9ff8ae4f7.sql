-- Add approval fields to generated_posters
ALTER TABLE public.generated_posters
ADD COLUMN approval_status text DEFAULT 'pending_review',
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text,
ADD COLUMN critique_id uuid REFERENCES public.critiques(id);

-- Add approval fields to generated_videos
ALTER TABLE public.generated_videos
ADD COLUMN approval_status text DEFAULT 'pending_review',
ADD COLUMN approved_by uuid REFERENCES auth.users(id),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text,
ADD COLUMN critique_id uuid REFERENCES public.critiques(id);

-- Create approval_history table
CREATE TABLE public.approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  action text NOT NULL,
  notes text,
  actor_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Create workflow_runs table for multi-agent tracking
CREATE TABLE public.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running',
  current_step text NOT NULL DEFAULT 'generating',
  content_type text NOT NULL,
  prompt text NOT NULL,
  brand_logo_url text,
  product_image_url text,
  brand_colors text,
  aspect_ratio text,
  generated_content_id uuid,
  critique_id uuid REFERENCES public.critiques(id),
  iteration_count integer DEFAULT 0,
  final_scores jsonb,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approval_history
CREATE POLICY "Allow public read access on approval_history"
ON public.approval_history FOR SELECT
TO PUBLIC USING (true);

CREATE POLICY "Allow public insert access on approval_history"
ON public.approval_history FOR INSERT
TO PUBLIC WITH CHECK (true);

-- RLS Policies for workflow_runs
CREATE POLICY "Allow public read access on workflow_runs"
ON public.workflow_runs FOR SELECT
TO PUBLIC USING (true);

CREATE POLICY "Allow public insert access on workflow_runs"
ON public.workflow_runs FOR INSERT
TO PUBLIC WITH CHECK (true);

CREATE POLICY "Allow public update access on workflow_runs"
ON public.workflow_runs FOR UPDATE
TO PUBLIC USING (true);

-- Create trigger for workflow_runs updated_at
CREATE TRIGGER update_workflow_runs_updated_at
BEFORE UPDATE ON public.workflow_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for workflow_runs
ALTER TABLE public.workflow_runs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_runs;