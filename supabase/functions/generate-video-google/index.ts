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
    .from('files')
    .upload(fileName, videoBlob, {
      contentType: 'video/mp4',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabaseClient.storage
    .from('files')
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

    // Build enhanced prompt with brand information
    let enhancedPrompt = `Create a professional advertising video. ${prompt}.`;

    if (brandColors) {
      const colors = typeof brandColors === 'string' ? brandColors : brandColors.join(', ');
      enhancedPrompt += ` Use these brand colors: ${colors}.`;
    }

    if (brandLogo) {
      enhancedPrompt += ' Include the brand logo prominently.';
    }

    if (productImage) {
      enhancedPrompt += ' Feature the product image as the main focus.';
    }

    enhancedPrompt += ' The video should be visually compelling and professional. Duration: 5-10 seconds.';

    // Call Google's Veo 2 API for video generation
    const generateResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/models/veo-002:generateVideo?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          aspectRatio: aspectRatio === '9:16' ? 'ASPECT_RATIO_9_16' : 'ASPECT_RATIO_16_9',
          length: 'LENGTH_5S_TO_10S'
        })
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Google Veo API error:', generateResponse.status, errorText);
      throw new Error(`Google Veo API error: ${generateResponse.status} - ${errorText}`);
    }

    const operationData = await generateResponse.json();
    const operationName = operationData.name;

    if (!operationName) {
      throw new Error('No operation name returned from video generation');
    }

    console.log('Video generation started, operation:', operationName);

    // Poll for completion (max 5 minutes)
    let operation = operationData;
    let pollCount = 0;
    const maxPolls = 30; // 30 polls * 10 seconds = 5 minutes max
    
    while (!operation.done && pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      pollCount++;
      
      const pollResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1alpha/${operationName}?key=${GOOGLE_API_KEY}`
      );

      if (!pollResponse.ok) {
        const pollError = await pollResponse.text();
        console.error('Poll error:', pollResponse.status, pollError);
        throw new Error(`Failed to poll operation status: ${pollResponse.status}`);
      }

      operation = await pollResponse.json();
      console.log('Operation status:', operation.done ? 'completed' : 'in progress', `(poll ${pollCount}/${maxPolls})`);
    }

    if (!operation.done) {
      throw new Error('Video generation timed out after 5 minutes');
    }

    const videoData = operation.response?.generatedVideo;
    const videoBase64 = videoData?.video;

    if (!videoBase64) {
      console.error('No video data in response:', JSON.stringify(operation.response));
      throw new Error('Video generation failed. No video data was provided.');
    }

    // Convert base64 to blob
    const binaryString = atob(videoBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const videoBlob = new Blob([bytes], { type: 'video/mp4' });

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