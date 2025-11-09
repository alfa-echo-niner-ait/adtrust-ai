import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { workflowId } = await req.json();

    if (!workflowId) {
      throw new Error("workflowId is required");
    }

    // Start workflow in background (non-blocking)
    runWorkflow(supabase, workflowId).catch((error) => {
      console.error("Background workflow error:", error);
    });

    return new Response(
      JSON.stringify({ message: "Workflow started" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error starting workflow:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function runWorkflow(supabase: any, workflowId: string) {
  const MAX_ITERATIONS = 3;
  const TARGET_SCORE = 0.8; // Score threshold (0.0-1.0 scale)

  try {
    // Load workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("workflow_runs")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (workflowError) throw workflowError;

    let iteration = 0;
    let currentPrompt = workflow.prompt;
    let bestScores = { 
      brand_fit_score: 0, 
      visual_quality_score: 0, 
      message_clarity_score: 0,
      tone_of_voice_score: 0,
      safety_score: 0 
    };
    let generatedContentId = null;

    while (iteration < MAX_ITERATIONS) {
      console.log(`Iteration ${iteration + 1} for workflow ${workflowId}`);

      // Step 1: Generate content
      await updateWorkflowStep(supabase, workflowId, "generating", iteration);
      
      const contentId = await generateContent(
        supabase,
        workflow.content_type,
        currentPrompt,
        workflow.brand_logo_url,
        workflow.product_image_url,
        workflow.brand_colors,
        workflow.aspect_ratio
      );

      if (!contentId) {
        throw new Error("Failed to generate content");
      }

      generatedContentId = contentId;

      // Wait for generation to complete
      const mediaUrl = await waitForGeneration(supabase, workflow.content_type, contentId);
      
      if (!mediaUrl) {
        throw new Error("Generation failed or timed out");
      }

      // Step 2: Critique content
      await updateWorkflowStep(supabase, workflowId, "critiquing", iteration);

      const critiqueId = await critiqueContent(
        supabase,
        mediaUrl,
        workflow.content_type === "video" ? "video" : "image",
        workflow.brand_colors,
        currentPrompt
      );

      if (!critiqueId) {
        throw new Error("Failed to critique content");
      }

      // Get critique scores
      const { data: critique } = await supabase
        .from("critiques")
        .select("brand_fit_score, visual_quality_score, message_clarity_score, tone_of_voice_score, safety_score, refinement_prompt")
        .eq("id", critiqueId)
        .single();

      if (critique) {
        bestScores = {
          brand_fit_score: critique.brand_fit_score,
          visual_quality_score: critique.visual_quality_score,
          message_clarity_score: critique.message_clarity_score,
          tone_of_voice_score: critique.tone_of_voice_score,
          safety_score: critique.safety_score,
        };

        // Check if scores meet target (average of all 5 scores)
        const avgScore = (
          critique.brand_fit_score +
          critique.visual_quality_score +
          (critique.message_clarity_score || 0) +
          (critique.tone_of_voice_score || 0) +
          critique.safety_score
        ) / 5;

        if (avgScore >= TARGET_SCORE) {
          console.log(`Target score achieved at iteration ${iteration + 1}: ${avgScore.toFixed(2)}`);
          
          
          // Update content with critique link and auto-approve
          const table = workflow.content_type === "video" ? "generated_videos" : "generated_posters";
          await supabase
            .from(table)
            .update({
              critique_id: critiqueId,
              approval_status: "auto_approved",
            })
            .eq("id", contentId);

          await supabase.from("workflow_runs").update({
            status: "completed",
            current_step: "completed",
            generated_content_id: contentId,
            critique_id: critiqueId,
            iteration_count: iteration + 1,
            final_scores: bestScores,
          }).eq("id", workflowId);

          return;
        }

        // Step 3: Refine for next iteration
        if (iteration < MAX_ITERATIONS - 1 && critique.refinement_prompt) {
          await updateWorkflowStep(supabase, workflowId, "refining", iteration);
          currentPrompt = critique.refinement_prompt;
        }
      }

      iteration++;
    }

    // Max iterations reached - mark as completed with current best
    const table = workflow.content_type === "video" ? "generated_videos" : "generated_posters";
    const mediaUrl = await getMediaUrl(supabase, workflow.content_type, generatedContentId || "");
    
    if (mediaUrl) {
      const { data: finalCritique } = await supabase
        .from("critiques")
        .select("id")
        .eq("media_url", mediaUrl)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      await supabase
        .from(table)
        .update({
          critique_id: finalCritique?.id,
          approval_status: "pending_review",
        })
        .eq("id", generatedContentId);

      await supabase.from("workflow_runs").update({
        status: "completed",
        current_step: "completed",
        generated_content_id: generatedContentId,
        critique_id: finalCritique?.id,
        iteration_count: iteration,
        final_scores: bestScores,
      }).eq("id", workflowId);
    }

  } catch (error) {
    console.error("Workflow error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await supabase.from("workflow_runs").update({
      status: "failed",
      error_message: errorMessage,
    }).eq("id", workflowId);
  }
}

async function updateWorkflowStep(supabase: any, workflowId: string, step: string, iteration: number) {
  await supabase.from("workflow_runs").update({
    current_step: step,
    iteration_count: iteration,
  }).eq("id", workflowId);
}

async function generateContent(
  supabase: any,
  contentType: string,
  prompt: string,
  brandLogoUrl: string | null,
  productImageUrl: string | null,
  brandColors: string | null,
  aspectRatio: string
): Promise<string | null> {
  const table = contentType === "video" ? "generated_videos" : "generated_posters";
  const urlField = contentType === "video" ? "video_url" : "poster_url";

  const { data, error } = await supabase
    .from(table)
    .insert({
      prompt,
      brand_logo_url: brandLogoUrl,
      product_image_url: productImageUrl,
      brand_colors: brandColors,
      aspect_ratio: aspectRatio,
      status: "pending",
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error inserting content:", error);
    return null;
  }

  // Trigger generation
  const functionName = contentType === "video" ? "generate-video-google" : "generate-poster-google";
  const idField = contentType === "video" ? "videoId" : "posterId";

  await supabase.functions.invoke(functionName, {
    body: {
      [idField]: data.id,
      prompt,
      brandLogo: brandLogoUrl,
      productImage: productImageUrl,
      aspectRatio: aspectRatio,
    },
  });

  return data.id;
}

async function waitForGeneration(
  supabase: any,
  contentType: string,
  contentId: string,
  maxWaitSeconds = 120
): Promise<string | null> {
  const table = contentType === "video" ? "generated_videos" : "generated_posters";
  const urlField = contentType === "video" ? "video_url" : "poster_url";
  
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    const { data } = await supabase
      .from(table)
      .select(`${urlField}, status`)
      .eq("id", contentId)
      .single();

    if (data && data[urlField] && data.status === "completed") {
      return data[urlField];
    }

    if (data && data.status === "failed") {
      return null;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  return null;
}

async function critiqueContent(
  supabase: any,
  mediaUrl: string,
  mediaType: string,
  brandColors: string | null,
  caption: string
): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("critique-with-google", {
    body: {
      mediaUrl,
      mediaType,
      brandColors: brandColors?.split(", ") || [],
      caption,
    },
  });

  if (error) {
    console.error("Critique function error:", error);
    return null;
  }

  const critiqueResult = data;

  const { data: critiqueData, error: critiqueError } = await supabase
    .from("critiques")
    .insert({
      media_url: mediaUrl,
      media_type: mediaType,
      caption,
      brand_colors: brandColors || "",
      brand_fit_score: critiqueResult.BrandFit_Score || 0,
      visual_quality_score: critiqueResult.VisualQuality_Score || 0,
      message_clarity_score: critiqueResult.MessageClarity_Score || 0,
      tone_of_voice_score: critiqueResult.ToneOfVoice_Score || 0,
      safety_score: critiqueResult.Safety_Score || 0,
      brand_validation: critiqueResult.BrandValidation || null,
      safety_breakdown: critiqueResult.SafetyBreakdown || null,
      critique_summary: critiqueResult.Critique_Summary || "",
      refinement_prompt: critiqueResult.Refinement_Prompt_Suggestion || "",
    })
    .select()
    .single();

  if (critiqueError || !critiqueData) {
    console.error("Error saving critique:", critiqueError);
    return null;
  }

  return critiqueData.id;
}

async function getMediaUrl(supabase: any, contentType: string, contentId: string): Promise<string | null> {
  const table = contentType === "video" ? "generated_videos" : "generated_posters";
  const urlField = contentType === "video" ? "video_url" : "poster_url";

  const { data } = await supabase
    .from(table)
    .select(urlField)
    .eq("id", contentId)
    .single();

  return data?.[urlField] || null;
}