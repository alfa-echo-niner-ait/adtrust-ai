import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { posterId, prompt, brandLogo, productImage, brandColors, aspectRatio = "1:1" } = await req.json();

    console.log("Generating poster for:", posterId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    // Build enhanced prompt with explicit instructions
    let enhancedPrompt = `Create a professional advertising poster with these requirements:

${prompt}

CRITICAL REQUIREMENTS:
`;

    if (brandColors) {
      const colors = typeof brandColors === 'string' ? brandColors : brandColors.join(', ');
      enhancedPrompt += `- PRIMARY REQUIREMENT: Use ONLY these exact brand colors as the main color palette: ${colors}. These colors must be dominant and visible throughout the design.\n`;
    }

    // Prepare content array with text and images
    const contentParts: any[] = [{ type: "text", text: enhancedPrompt }];

    // Helper function to safely convert to base64
    const toBase64 = (buffer: ArrayBuffer): string => {
      const uint8Array = new Uint8Array(buffer);
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode(...chunk);
      }
      return btoa(binaryString);
    };

    // Fetch and include brand logo if provided
    if (brandLogo) {
      try {
        const logoResponse = await fetch(brandLogo);
        const logoBuffer = await logoResponse.arrayBuffer();
        const logoBase64 = toBase64(logoBuffer);
        const logoMimeType = logoResponse.headers.get('content-type') || 'image/png';
        
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${logoMimeType};base64,${logoBase64}` }
        });
        
        contentParts.push({
          type: "text",
          text: "- CRITICAL: Include the brand logo shown above prominently in the poster design. Position it professionally (top corner or center based on design).\n"
        });
      } catch (error) {
        console.error("Error fetching brand logo:", error);
      }
    }

    // Fetch and include product image if provided
    if (productImage) {
      try {
        const productResponse = await fetch(productImage);
        const productBuffer = await productResponse.arrayBuffer();
        const productBase64 = toBase64(productBuffer);
        const productMimeType = productResponse.headers.get('content-type') || 'image/png';
        
        contentParts.push({
          type: "image_url",
          image_url: { url: `data:${productMimeType};base64,${productBase64}` }
        });
        
        contentParts.push({
          type: "text",
          text: "- CRITICAL: Feature the product shown above as the focal point of the advertisement.\n"
        });
      } catch (error) {
        console.error("Error fetching product image:", error);
      }
    }

    contentParts.push({
      type: "text",
      text: `\nDesign specifications:
- Aspect ratio: ${aspectRatio}
- Style: Modern, professional, eye-catching
- Quality: High-resolution, suitable for advertising
- Composition: Balanced layout with clear visual hierarchy

Make it visually stunning and ready for commercial use.`
    });
    
    // Call Lovable AI with Gemini model for image generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: contentParts,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    const data = await response.json();
    console.log("AI response:", data);

    let posterUrl = null;

    if (data.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
      const base64Image = data.choices[0].message.images[0].image_url.url;
      
      // Convert base64 to blob and upload to Supabase storage
      const base64Data = base64Image.split(",")[1];
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `posters/${posterId}-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("video-assets")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("video-assets")
        .getPublicUrl(fileName);

      posterUrl = publicUrl;
    }

    // Update database with poster URL
    const { error: updateError } = await supabase
      .from("generated_posters")
      .update({
        poster_url: posterUrl,
        status: posterUrl ? "completed" : "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", posterId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, posterUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    
    // Try to mark as failed in database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { posterId } = await req.json();
      await supabase
        .from("generated_posters")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", posterId);
    } catch (e) {
      console.error("Failed to update status:", e);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
