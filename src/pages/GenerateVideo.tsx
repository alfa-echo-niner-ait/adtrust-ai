import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Video, Loader2, Image as ImageIcon, Save, Eye, Upload, X, Maximize2, Palette } from 'lucide-react';
import { ColorPicker } from '@/components/ColorPicker';
import { ColorDisplay } from '@/components/ColorDisplay';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { extractColorsFromImage } from '@/lib/colorExtraction';

export default function GenerateVideo() {
  const location = useLocation();
  const [videoPrompt, setVideoPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [extractingColors, setExtractingColors] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Pre-fill from critique results
  useEffect(() => {
    if (location.state) {
      if (location.state.prompt) setVideoPrompt(location.state.prompt);
      if (location.state.brandColors) setBrandColors(location.state.brandColors);
      if (location.state.aspectRatio) setAspectRatio(location.state.aspectRatio);
    }
  }, [location.state]);

  const handleAddColor = (color: string) => {
    if (!brandColors.includes(color)) {
      setBrandColors([...brandColors, color]);
    } else {
      toast({
        title: "Color Already Added",
        description: "This color is already in your palette",
        variant: "destructive",
      });
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setBrandColors(brandColors.filter(color => color !== colorToRemove));
  };

  const handleFileChange = async (file: File | undefined, type: 'logo' | 'product') => {
    if (!file) return;
    
    if (type === 'logo') setBrandLogoFile(file);
    else setProductImageFile(file);

    // Extract colors from image
    setExtractingColors(true);
    try {
      const colors = await extractColorsFromImage(file, 5);
      setSuggestedColors(colors);
      toast({
        title: "Colors Extracted",
        description: `Found ${colors.length} dominant colors from image`,
      });
    } catch (error) {
      console.error('Error extracting colors:', error);
      toast({
        title: "Extraction Failed",
        description: "Could not extract colors from image",
        variant: "destructive",
      });
    } finally {
      setExtractingColors(false);
    }
  };

  const handleRemoveFile = (type: 'logo' | 'product') => {
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
      toast({
        title: "Colors Added",
        description: `Added ${newColors.length} colors to your palette`,
      });
    } else {
      toast({
        title: "Already Added",
        description: "All suggested colors are already in your palette",
      });
    }
  };

  const uploadFile = async (file: File, type: 'logo' | 'product'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('video-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('video-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a video prompt.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      let finalBrandLogoUrl: string | null = null;
      let finalProductImageUrl: string | null = null;

      // Upload files if provided
      if (brandLogoFile) {
        finalBrandLogoUrl = await uploadFile(brandLogoFile, 'logo');
      }
      if (productImageFile) {
        finalProductImageUrl = await uploadFile(productImageFile, 'product');
      }

      // Insert initial record
      const { data: videoData, error: insertError } = await supabase
        .from('generated_videos')
        .insert({
          prompt: videoPrompt,
          brand_logo_url: finalBrandLogoUrl || null,
          product_image_url: finalProductImageUrl || null,
          brand_colors: brandColors.length > 0 ? brandColors.join(', ') : null,
          aspect_ratio: aspectRatio,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setCurrentVideoId(videoData.id);

      // Call Google video generation edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-video-google',
        {
          body: {
            videoId: videoData.id,
            prompt: videoPrompt,
            brandLogo: finalBrandLogoUrl || undefined,
            productImage: finalProductImageUrl || undefined,
            aspectRatio
          }
        }
      );

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(`Failed to generate video: ${functionError.message}`);
      }

      if (!functionData?.videoUrl) {
        throw new Error('No video URL returned');
      }

      setGeneratedVideoUrl(functionData.videoUrl);

      toast({
        title: "Video Generated",
        description: functionData.message || "Your video has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate video. Please try again.",
        variant: "destructive",
      });

      // Update status to failed
      if (currentVideoId) {
        await supabase
          .from('generated_videos')
          .update({ status: 'failed' })
          .eq('id', currentVideoId);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndCritique = () => {
    if (generatedVideoUrl) {
      navigate('/critique', { state: { videoUrl: generatedVideoUrl } });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumb items={[{ label: "Generate Video" }]} />
      
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Generate Video</h1>
          <p className="text-muted-foreground">Create a 5-15 second AI-generated video ad</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Video Generation Settings
            </CardTitle>
            <CardDescription>
              Powered by AI video generation (Google Veo, Runway, Pika Labs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="videoPrompt">Video Prompt</Label>
                <Textarea
                  id="videoPrompt"
                  placeholder="Describe the video ad you want to generate... Example: A dynamic product showcase with smooth camera movements highlighting the key features"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  disabled={generating}
                  rows={4}
                  className="bg-secondary/50 resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-primary" />
                  Aspect Ratio
                </Label>
                <RadioGroup value={aspectRatio} onValueChange={setAspectRatio} disabled={generating} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="16:9" id="video-ratio-16-9" />
                    <Label htmlFor="video-ratio-16-9" className="cursor-pointer font-normal">16:9 Widescreen</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="9:16" id="video-ratio-9-16" />
                    <Label htmlFor="video-ratio-9-16" className="cursor-pointer font-normal">9:16 Vertical</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Brand Logo Upload */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Brand Logo (Optional)
                  </Label>
                  
                  {!brandLogoFile ? (
                    <label
                      htmlFor="brand-logo-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50 border-border transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center py-4">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">Click to upload</span>
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                      </div>
                      <Input
                        id="brand-logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e.target.files?.[0], 'logo')}
                        disabled={generating}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden bg-secondary/30 border border-border">
                        <img
                          src={URL.createObjectURL(brandLogoFile)}
                          alt="Brand logo preview"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border">
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {brandLogoFile.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile('logo')}
                          disabled={generating}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Image Upload */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Product Image (Optional)
                  </Label>
                  
                  {!productImageFile ? (
                    <label
                      htmlFor="product-image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50 border-border transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center py-4">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">Click to upload</span>
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
                      </div>
                      <Input
                        id="product-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e.target.files?.[0], 'product')}
                        disabled={generating}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden bg-secondary/30 border border-border">
                        <img
                          src={URL.createObjectURL(productImageFile)}
                          alt="Product preview"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border">
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {productImageFile.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile('product')}
                          disabled={generating}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
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
                type="button"
                onClick={handleGenerateVideo}
                disabled={generating}
                className="w-full gradient-primary text-primary-foreground font-semibold shadow-glow"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {generatedVideoUrl && (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Generated Video Preview
              </CardTitle>
              <CardDescription>Your AI-generated video ad is ready!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={generatedVideoUrl}
                    controls
                    className="w-full h-full"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveAndCritique}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    <Save className="h-5 w-5" />
                    Save & Critique
                  </Button>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="gap-2"
                    size="lg"
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
