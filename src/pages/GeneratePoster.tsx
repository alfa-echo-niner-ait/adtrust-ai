import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, Sparkles } from "lucide-react";

const GeneratePoster = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [brandColors, setBrandColors] = useState("");
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo') setBrandLogoFile(file);
      else setProductImageFile(file);
    }
  };

  const clearFile = (type: 'logo' | 'product') => {
    if (type === 'logo') setBrandLogoFile(null);
    else setProductImageFile(null);
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("video-assets")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("video-assets")
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleGeneratePoster = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setGenerating(true);

    try {
      let brandLogoUrl = null;
      let productImageUrl = null;

      if (brandLogoFile) {
        brandLogoUrl = await uploadFile(brandLogoFile, `logos/${Date.now()}-${brandLogoFile.name}`);
      }

      if (productImageFile) {
        productImageUrl = await uploadFile(productImageFile, `products/${Date.now()}-${productImageFile.name}`);
      }

      const { data: posterData, error: insertError } = await supabase
        .from("generated_posters")
        .insert({
          prompt,
          brand_logo_url: brandLogoUrl,
          product_image_url: productImageUrl,
          brand_colors: brandColors,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Poster generation started!");
      
      // Call edge function to generate poster
      const { error: functionError } = await supabase.functions.invoke("generate-poster-google", {
        body: {
          posterId: posterData.id,
          prompt,
          brandLogo: brandLogoUrl,
          productImage: productImageUrl,
          brandColors,
        },
      });

      if (functionError) throw functionError;

      navigate(`/poster/${posterData.id}`);
    } catch (error) {
      console.error("Error generating poster:", error);
      toast.error("Failed to generate poster");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Poster / Image Ad
          </CardTitle>
          <CardDescription>
            Create stunning poster designs and image ads with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt *</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the poster you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandColors">Brand Colors (optional)</Label>
            <Input
              id="brandColors"
              placeholder="e.g., #FF5733, #3498DB"
              value={brandColors}
              onChange={(e) => setBrandColors(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Brand Logo (optional)</Label>
              {brandLogoFile ? (
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(brandLogoFile)}
                    alt="Brand logo preview"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => clearFile('logo')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'logo')}
                  />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Product Image (optional)</Label>
              {productImageFile ? (
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(productImageFile)}
                    alt="Product preview"
                    className="w-full h-full object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => clearFile('product')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'product')}
                  />
                </label>
              )}
            </div>
          </div>

          <Button
            onClick={handleGeneratePoster}
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating ? "Generating..." : "Generate Poster"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratePoster;
