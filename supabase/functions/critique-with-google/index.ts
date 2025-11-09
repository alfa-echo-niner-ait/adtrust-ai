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

    // Format brand colors for emphasis
    const formattedColors = Array.isArray(brandColors) 
      ? brandColors.join(', ') 
      : brandColors;

    // Construct the prompt with strong emphasis on brand requirements
    const systemPrompt = `You are an expert AI brand compliance and ad critique specialist. 
Analyze the provided ad media (image or video) and caption against the brand guidelines.

BRAND REQUIREMENTS:
- Required Brand Colors: ${formattedColors}
  IMPORTANT: Check if these EXACT colors are prominently used in the design. Score lower if brand colors are missing or not dominant.
- Ad Caption/Message: ${caption}

Evaluate the ad across these dimensions (score 0.0-1.0):

1. Brand Fit Score (0.0-1.0): 
   - Are the brand colors (${formattedColors}) ACTUALLY visible and dominant in the design?
   - Does the visual identity match the brand requirements?
   - Is the messaging consistent with the caption?
   - Score 0.6 or lower if brand colors are not prominently featured

2. Visual Quality Score (0.0-1.0):
   - Is the composition professional and well-balanced?
   - Is it clear, high-resolution, and visually appealing?
   - Does it have good contrast and readability?

3. Safety Score (0.0-1.0):
   - Does it avoid harmful stereotypes, misleading claims, or offensive content?
   - Is it appropriate for general audiences?
   - Does it follow advertising ethics?

Provide your response in the following JSON format:
{
  "BrandFit_Score": 0.85,
  "VisualQuality_Score": 0.92,
  "Safety_Score": 0.78,
  "Critique_Summary": "A detailed 2-3 sentence summary highlighting: 1) whether brand colors are present and visible, 2) logo/product usage, 3) overall quality and areas for improvement",
  "Refinement_Prompt_Suggestion": "A detailed prompt for regenerating the ad that EXPLICITLY states: Use these exact brand colors: ${formattedColors}. Include specific instructions about color usage, logo placement, and product presentation."
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