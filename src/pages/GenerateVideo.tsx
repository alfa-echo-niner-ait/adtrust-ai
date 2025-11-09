import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Loader2, Image as ImageIcon, Save, Eye, Upload, X, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function GenerateVideo() {
  const [videoPrompt, setVideoPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

              <div className="space-y-2">
                <Label htmlFor="aspectRatio" className="flex items-center gap-2">
                  <Maximize2 className="h-4 w-4 text-primary" />
                  Aspect Ratio
                </Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="aspectRatio" className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                    <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                  </SelectContent>
                </Select>
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setBrandLogoFile(file);
                        }}
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
                          onClick={() => setBrandLogoFile(null)}
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProductImageFile(file);
                        }}
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
                          onClick={() => setProductImageFile(null)}
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
