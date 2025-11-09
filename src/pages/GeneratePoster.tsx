import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Upload, X, Sparkles, Maximize2, Loader2, Palette } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ColorPicker } from "@/components/ColorPicker";
import { ColorDisplay } from "@/components/ColorDisplay";
import { extractColorsFromImage } from "@/lib/colorExtraction";

const GeneratePoster = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [extractingColors, setExtractingColors] = useState(false);

  // Pre-fill from critique results
  useEffect(() => {
    if (location.state) {
      if (location.state.prompt) setPrompt(location.state.prompt);
      if (location.state.brandColors) setBrandColors(location.state.brandColors);
      if (location.state.aspectRatio) setAspectRatio(location.state.aspectRatio);
    }
  }, [location.state]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'logo') setBrandLogoFile(file);
      else setProductImageFile(file);

      // Extract colors from image
      setExtractingColors(true);
      try {
        const colors = await extractColorsFromImage(file, 5);
        setSuggestedColors(colors);
        toast.success(`Extracted ${colors.length} colors from image`);
      } catch (error) {
        console.error('Error extracting colors:', error);
        toast.error('Failed to extract colors from image');
      } finally {
        setExtractingColors(false);
      }
    }
  };

  const clearFile = (type: 'logo' | 'product') => {
    if (type === 'logo') setBrandLogoFile(null);
    else setProductImageFile(null);
    
    // Clear suggested colors when all images are removed
    if ((type === 'logo' && !productImageFile) || (type === 'product' && !brandLogoFile)) {
      setSuggestedColors([]);
    }
  };

  const handleAddSuggestedColors = () => {
    const newColors = suggestedColors.filter(color => !brandColors.includes(color));
    if (newColors.length > 0) {
      setBrandColors([...brandColors, ...newColors]);
      setSuggestedColors([]); // Clear suggestions
      toast.success(`Added ${newColors.length} colors`);
    } else {
      toast.info('All suggested colors already added');
    }
  };

  const handleAddColor = (color: string) => {
    if (!brandColors.includes(color)) {
      setBrandColors([...brandColors, color]);
    } else {
      toast.error("Color already added");
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setBrandColors(brandColors.filter((color) => color !== colorToRemove));
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
        brand_colors: brandColors.join(", "),
        aspect_ratio: aspectRatio,
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
          brandColors: brandColors.join(", "),
          aspectRatio,
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
      <Breadcrumb items={[{ label: "Generate Poster" }]} />
      
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
              disabled={generating}
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              Aspect Ratio
            </Label>
            <RadioGroup value={aspectRatio} onValueChange={setAspectRatio} disabled={generating} className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1:1" id="ratio-1-1" />
                <Label htmlFor="ratio-1-1" className="cursor-pointer font-normal">1:1 Square</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3:4" id="ratio-3-4" />
                <Label htmlFor="ratio-3-4" className="cursor-pointer font-normal">3:4 Portrait</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4:3" id="ratio-4-3" />
                <Label htmlFor="ratio-4-3" className="cursor-pointer font-normal">4:3 Landscape</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="9:16" id="ratio-9-16" />
                <Label htmlFor="ratio-9-16" className="cursor-pointer font-normal">9:16 Vertical</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="16:9" id="ratio-16-9" />
                <Label htmlFor="ratio-16-9" className="cursor-pointer font-normal">16:9 Wide</Label>
              </div>
            </RadioGroup>
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
                    disabled={generating}
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
                    disabled={generating}
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
                    disabled={generating}
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
                    disabled={generating}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-4 p-6 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <Label>Brand Colors</Label>
              {extractingColors && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Extracting colors...
                </span>
              )}
            </div>
            
            {suggestedColors.length > 0 && (
              <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Suggested Colors from Image
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSuggestedColors}
                    disabled={generating}
                  >
                    Add All
                  </Button>
                </div>
                <ColorDisplay
                  colors={suggestedColors}
                  onRemoveColor={() => {}}
                  showRemove={false}
                />
              </div>
            )}

            <ColorPicker onAddColor={handleAddColor} disabled={generating} />
            <ColorDisplay 
              colors={brandColors} 
              onRemoveColor={handleRemoveColor}
              disabled={generating}
            />
          </div>

          <Button
            onClick={handleGeneratePoster}
            disabled={generating}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Poster
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratePoster;
