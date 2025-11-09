import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sparkles, Video, FileText, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WorkflowProgressProps {
  workflowId: string;
}

interface WorkflowRun {
  id: string;
  status: string;
  current_step: string;
  content_type: string;
  prompt: string;
  iteration_count: number;
  final_scores: any;
  error_message: string | null;
  created_at: string;
  generated_content_id: string | null;
}

export const WorkflowProgress = ({ workflowId }: WorkflowProgressProps) => {
  const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkflow();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('workflow-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflow_runs',
          filter: `id=eq.${workflowId}`,
        },
        (payload) => {
          const updatedWorkflow = payload.new as WorkflowRun;
          setWorkflow(updatedWorkflow);
          
          // Load content if workflow completed
          if (updatedWorkflow.status === "completed" && updatedWorkflow.generated_content_id) {
            loadGeneratedContent(updatedWorkflow.content_type, updatedWorkflow.generated_content_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflowId]);

  const loadWorkflow = async () => {
    const { data, error } = await supabase
      .from("workflow_runs")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (error) {
      console.error("Error loading workflow:", error);
      return;
    }

    setWorkflow(data);
    
    // Load content if workflow already completed
    if (data.status === "completed" && data.generated_content_id) {
      loadGeneratedContent(data.content_type, data.generated_content_id);
    }
  };

  const loadGeneratedContent = async (contentType: string, contentId: string) => {
    const table = contentType === "video" ? "generated_videos" : "generated_posters";
    const urlField = contentType === "video" ? "video_url" : "poster_url";
    
    const { data, error } = await supabase
      .from(table)
      .select(urlField)
      .eq("id", contentId)
      .maybeSingle();

    if (error) {
      console.error("Error loading content:", error);
      return;
    }

    if (data) {
      setContentUrl(data[urlField]);
    }
  };

  const steps = [
    { id: "generating", label: "Generating Content", icon: workflow?.content_type === "video" ? Video : Sparkles },
    { id: "critiquing", label: "AI Critique", icon: FileText },
    { id: "refining", label: "Auto-Refinement", icon: RefreshCw },
    { id: "completed", label: "Completed", icon: CheckCircle2 },
  ];

  const getCurrentStepIndex = () => {
    if (!workflow) return 0;
    if (workflow.status === "completed" || workflow.status === "failed") return steps.length - 1;
    return steps.findIndex(s => s.id === workflow.current_step);
  };

  const currentStepIndex = getCurrentStepIndex();

  if (!workflow) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Multi-Agent Workflow</CardTitle>
            <CardDescription>
              Iteration {workflow.iteration_count + 1} of 3
            </CardDescription>
          </div>
          <Badge variant={workflow.status === "completed" ? "default" : workflow.status === "failed" ? "destructive" : "secondary"}>
            {workflow.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`
                  flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all
                  ${isCompleted ? "bg-success border-success text-success-foreground" : ""}
                  ${isCurrent ? "bg-primary border-primary text-primary-foreground animate-pulse" : ""}
                  ${isPending ? "bg-muted border-border text-muted-foreground" : ""}
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isCurrent ? "text-primary" : ""}`}>
                    {step.label}
                  </p>
                  {isCurrent && workflow.status === "running" && (
                    <p className="text-sm text-muted-foreground">Processing...</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {workflow.final_scores && (
          <div className="border-t pt-4 space-y-4">
            <p className="text-sm font-medium mb-3">Final Scores</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {(workflow.final_scores.brand_fit_score || 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Brand Fit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {(workflow.final_scores.visual_quality_score || 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Visual Quality</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {(workflow.final_scores.message_clarity_score || 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Message Clarity</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {(workflow.final_scores.tone_of_voice_score || 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Tone of Voice</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {(workflow.final_scores.safety_score || 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Safety</p>
              </div>
            </div>
            
            {workflow.status === "completed" && contentUrl && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Generated Content</p>
                <div className="rounded-lg overflow-hidden border bg-muted/20">
                  {workflow.content_type === "video" ? (
                    <video 
                      src={contentUrl} 
                      controls 
                      className="w-full max-h-[400px] object-contain"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img 
                      src={contentUrl} 
                      alt="Generated poster" 
                      className="w-full max-h-[400px] object-contain"
                    />
                  )}
                </div>
              </div>
            )}
            
            {workflow.status === "completed" && workflow.generated_content_id && (
              <Button 
                onClick={() => {
                  const path = workflow.content_type === "video" 
                    ? `/video/${workflow.generated_content_id}`
                    : `/poster/${workflow.generated_content_id}`;
                  navigate(path);
                }}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                View Full Details
              </Button>
            )}
          </div>
        )}

        {workflow.error_message && (
          <div className="border border-destructive/30 bg-destructive/10 rounded-lg p-4">
            <p className="text-sm text-destructive-foreground">{workflow.error_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};