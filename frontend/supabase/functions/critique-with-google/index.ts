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

    // Construct comprehensive critique prompt with all 5 scoring dimensions
    const systemPrompt = `You are an expert brand and creative director evaluating AI-generated ads. 
Analyze the provided ad creative and provide a comprehensive critique based on these brand guidelines:

Brand Colors: ${formattedColors}
Caption/Message: ${caption}

Evaluate the following aspects with precision:

1. BRAND ALIGNMENT (0-1): How well does the visual content match the provided brand colors? Does it use the correct logo? Is the overall aesthetic on-brand?

2. VISUAL QUALITY (0-1): Assess composition, clarity, professionalism, absence of artifacts, watermarks, or blurriness

3. MESSAGE CLARITY (0-1): Is the product/service obvious? Is the tagline/caption clear and correct? Can viewers immediately understand what's being advertised?

4. TONE OF VOICE (0-1): Does the messaging style, language, and overall communication match the expected brand voice? Is it appropriate for the target audience?

5. SAFETY & ETHICS (0-1): Check for harmful content, stereotypes, misleading claims, or any unsafe elements

6. BRAND VALIDATION: Compare the generated content against provided brand assets:
   - Calculate what percentage of the provided brand colors are actually present in the ad
   - Check if a logo is visible and appears correct
   - Assess overall brand consistency

7. SAFETY BREAKDOWN: Provide granular safety analysis:
   - Harmful content detection (violence, adult content, etc.)
   - Stereotype detection (racial, gender, age-based stereotypes)
   - Misleading claims detection (false promises, exaggerations)

Return ONLY a JSON object with this exact structure:
{
  "BrandFit_Score": 0.85,
  "VisualQuality_Score": 0.92,
  "MessageClarity_Score": 0.88,
  "ToneOfVoice_Score": 0.90,
  "Safety_Score": 0.95,
  "BrandValidation": {
    "color_match_percentage": 75,
    "logo_present": true,
    "logo_correct": true,
    "overall_consistency": 0.82
  },
  "SafetyBreakdown": {
    "harmful_content": 1.0,
    "stereotypes": 1.0,
    "misleading_claims": 0.9
  },
  "Critique_Summary": "Detailed explanation covering all dimensions, highlighting strengths and areas for improvement",
  "Refinement_Prompt_Suggestion": "Specific actionable suggestions to improve the ad in the next generation, explicitly mentioning brand colors: ${formattedColors}"
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