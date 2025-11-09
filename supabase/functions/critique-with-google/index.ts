import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const { mediaUrl, brandColors, caption, mediaType } = await req.json();

    if (!mediaUrl || !brandColors || !caption) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: mediaUrl, brandColors, caption' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Critiquing ad with Google Gemini:', { mediaUrl, brandColors, caption, mediaType });

    // Fetch the media file
    const mediaResponse = await fetch(mediaUrl);
    const mediaBuffer = await mediaResponse.arrayBuffer();
    
    // Convert to base64 safely for large files
    const uint8Array = new Uint8Array(mediaBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    const mediaBase64 = btoa(binaryString);
    
    // Determine MIME type
    const mimeType = mediaType === 'video' 
      ? 'video/mp4' 
      : mediaResponse.headers.get('content-type') || 'image/jpeg';

    // Construct the prompt
    const systemPrompt = `You are an expert AI brand compliance and ad critique specialist. 
Analyze the provided ad media (image or video) and caption against the brand guidelines.

Brand Colors: ${brandColors}
Ad Caption: ${caption}

Evaluate the ad across these dimensions:
1. Brand Fit (0.0-1.0): How well does the ad align with brand colors, visual identity, and messaging?
2. Visual Quality (0.0-1.0): Is the composition professional? Is it clear and high-resolution?
3. Safety & Ethics (0.0-1.0): Does it avoid harmful stereotypes, misleading claims, or offensive content?

Provide your response in the following JSON format:
{
  "BrandFit_Score": 0.85,
  "VisualQuality_Score": 0.92,
  "Safety_Score": 0.78,
  "Critique_Summary": "A detailed 2-3 sentence summary of the ad's strengths and areas for improvement",
  "Refinement_Prompt_Suggestion": "A detailed prompt for regenerating the ad with specific improvements"
}`;

    // Call Google Gemini API with vision
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: mediaBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', response.status, errorText);
      throw new Error(`Google API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Google API response:', JSON.stringify(data, null, 2));

    // Extract the text from the response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Google API');
    }

    // Parse the JSON response from the AI
    // Remove markdown code blocks if present
    const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanedText);

    console.log('Parsed critique result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in critique-with-google function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});