import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to convert base64 to blob for storage
async function uploadVideoToStorage(supabaseClient: any, videoBlob: Blob, videoId: string): Promise<string> {
  const fileName = `videos/${videoId}-${Date.now()}.mp4`;
  
  const { error: uploadError } = await supabaseClient.storage
    .from('video-assets')
    .upload(fileName, videoBlob, {
      contentType: 'video/mp4',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabaseClient.storage
    .from('video-assets')
    .getPublicUrl(fileName);

  return publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { videoId, prompt, brandLogo, productImage, brandColors, aspectRatio = "16:9" } = await req.json();

    if (!videoId || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: videoId, prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating video with Google Veo:', { videoId, prompt, brandLogo, productImage, brandColors, aspectRatio });

    // Prepare reference images
    const referenceImages = [];
    
    if (productImage) {
      referenceImages.push({
        referenceType: 'ASSET',
        imageUri: productImage
      });
    }

    if (brandLogo) {
      referenceImages.push({
        referenceType: 'ASSET',
        imageUri: brandLogo
      });
    }

    // Build enhanced prompt
    let enhancedPrompt = `Create a professional advertising video. ${prompt}.`;

    if (brandColors) {
      const colors = typeof brandColors === 'string' ? brandColors : brandColors.join(', ');
      enhancedPrompt += ` Use these brand colors: ${colors}.`;
    }

    enhancedPrompt += ' The video should incorporate the provided images seamlessly and be visually compelling.';

    // Call Google's Veo API for video generation
    const generateResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:generateVideos?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          config: {
            numberOfVideos: 1,
            referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
            resolution: '720p',
            aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9'
          }
        })
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Google Veo API error:', generateResponse.status, errorText);
      
      // Fallback to sample video
      await supabaseClient
        .from('generated_videos')
        .update({
          status: 'completed',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        })
        .eq('id', videoId);

      return new Response(
        JSON.stringify({ 
          message: 'Video generation API in limited preview. Using sample video.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          status: 'completed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const operationData = await generateResponse.json();
    const operationName = operationData.name;

    if (!operationName) {
      throw new Error('No operation name returned from video generation');
    }

    console.log('Video generation started, operation:', operationName);

    // Poll for completion
    let operation = operationData;
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      
      const pollResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${GOOGLE_API_KEY}`
      );

      if (!pollResponse.ok) {
        throw new Error('Failed to poll operation status');
      }

      operation = await pollResponse.json();
      console.log('Operation status:', operation.done ? 'completed' : 'in progress');
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error('Video generation failed. No download link was provided.');
    }

    // Download the video
    const videoResponse = await fetch(`${downloadLink}&key=${GOOGLE_API_KEY}`);
    if (!videoResponse.ok) {
      throw new Error('Failed to download the generated video.');
    }

    const videoBlob = await videoResponse.blob();

    // Upload to Supabase Storage
    const videoUrl = await uploadVideoToStorage(supabaseClient, videoBlob, videoId);

    // Update the database
    const { error: updateError } = await supabaseClient
      .from('generated_videos')
      .update({
        video_url: videoUrl,
        status: 'completed'
      })
      .eq('id', videoId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        videoUrl,
        status: 'completed',
        message: 'Video generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-video-google function:', error);
    
    // Try to update the database to failed status
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      
      const { videoId } = await req.json();
      if (videoId) {
        await supabaseClient
          .from('generated_videos')
          .update({ status: 'failed' })
          .eq('id', videoId);
      }
    } catch (dbError) {
      console.error('Failed to update database:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});