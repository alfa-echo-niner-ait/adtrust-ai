import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Video, Loader2, Image as ImageIcon, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function GenerateVideo() {
  const [videoPrompt, setVideoPrompt] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [productImage, setProductImage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGenerateVideo = async () => {
    if (!videoPrompt || !brandLogo || !productImage) {
      toast({
        title: "Missing Information",
        description: "Please provide video prompt, brand logo, and product image.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Insert initial record
      const { data: videoData, error: insertError } = await supabase
        .from('generated_videos')
        .insert({
          prompt: videoPrompt,
          brand_logo_url: brandLogo,
          product_image_url: productImage,
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
            brandLogo: brandLogo,
            productImage: productImage
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brandLogo" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Brand Logo URL
                  </Label>
                  <Input
                    id="brandLogo"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={brandLogo}
                    onChange={(e) => setBrandLogo(e.target.value)}
                    disabled={generating}
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productImage" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Product Image URL
                  </Label>
                  <Input
                    id="productImage"
                    type="url"
                    placeholder="https://example.com/product.jpg"
                    value={productImage}
                    onChange={(e) => setProductImage(e.target.value)}
                    disabled={generating}
                    className="bg-secondary/50"
                  />
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
