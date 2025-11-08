import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Sparkles, Image as ImageIcon, Palette, FileText, Loader2, Video, Upload, Link2 } from 'lucide-react';
import { useCritique } from '@/hooks/useCritique';
import { ScoreIndicator } from '@/components/ScoreIndicator';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CritiqueAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>('url');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [brandColors, setBrandColors] = useState('');
  const [caption, setCaption] = useState('');
  
  const { loading, error, result, runCritique } = useCritique();
  const { toast } = useToast();

  // Check if we're coming from video generation
  useEffect(() => {
    if (location.state?.videoUrl) {
      setMediaUrl(location.state.videoUrl);
      setMediaType('video');
      setInputMethod('url');
    }
  }, [location.state]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mediaSource = inputMethod === 'url' ? mediaUrl : uploadedFile;
    
    if (!mediaSource || !brandColors || !caption) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before running the critique.",
        variant: "destructive",
      });
      return;
    }

    const critiqueId = await runCritique({ 
      mediaUrl, 
      brandColors, 
      caption,
      mediaType 
    });

    if (critiqueId) {
      // Navigate to results page after critique completes
      setTimeout(() => {
        navigate(`/results/${critiqueId}`);
      }, 1000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Critique Analysis</h1>
          <p className="text-muted-foreground">Submit your ad for AI-powered critique and optimization</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ad Submission
            </CardTitle>
            <CardDescription>
              Configure your brand parameters and submit ad media for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Media Type Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Media Type
                </Label>
                <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as 'image' | 'video')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image" className="gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </TabsTrigger>
                    <TabsTrigger value="video" className="gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Input Method Selection */}
              <div className="space-y-3">
                <Label>Input Method</Label>
                <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'url' | 'upload')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="gap-2">
                      <Link2 className="h-4 w-4" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Media Input */}
                <div className="space-y-2">
                  <Label htmlFor="mediaInput" className="flex items-center gap-2">
                    {mediaType === 'image' ? <ImageIcon className="h-4 w-4 text-primary" /> : <Video className="h-4 w-4 text-primary" />}
                    {mediaType === 'image' ? 'Image' : 'Video'} {inputMethod === 'url' ? 'URL' : 'Upload'}
                  </Label>
                  
                  {inputMethod === 'url' ? (
                    <Input
                      id="mediaInput"
                      type="url"
                      placeholder={`https://example.com/ad-${mediaType}.${mediaType === 'image' ? 'jpg' : 'mp4'}`}
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      disabled={loading}
                      className="bg-secondary/50"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Input
                        id="mediaInput"
                        type="file"
                        accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                        onChange={handleFileUpload}
                        disabled={loading}
                        className="bg-secondary/50"
                      />
                      {uploadedFile && (
                        <p className="text-xs text-primary">
                          Selected: {uploadedFile.name}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {inputMethod === 'url' 
                      ? `Provide a direct link to your ad ${mediaType}`
                      : `Upload your ad ${mediaType} file`
                    }
                  </p>
                </div>

                {/* Brand Colors */}
                <div className="space-y-2">
                  <Label htmlFor="brandColors" className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Brand Colors (HEX)
                  </Label>
                  <Input
                    id="brandColors"
                    type="text"
                    placeholder="#1E40AF, #3B82F6"
                    value={brandColors}
                    onChange={(e) => setBrandColors(e.target.value)}
                    disabled={loading}
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your brand's primary color codes
                  </p>
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Ad Caption
                </Label>
                <Textarea
                  id="caption"
                  placeholder="Enter your ad copy and messaging here..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={loading}
                  rows={4}
                  className="bg-secondary/50 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Include the text content and key messaging from your ad
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Critique in Progress...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Run Critique 🚀
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Quick Preview Results (optional inline display) */}
        {result && !loading && (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Quick Preview
              </CardTitle>
              <CardDescription>
                Full results available on the results page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <ScoreIndicator
                  score={result.BrandFit_Score}
                  label="Brand Fit"
                  icon={<Palette className="h-4 w-4" />}
                />
                <ScoreIndicator
                  score={result.VisualQuality_Score}
                  label="Visual Quality"
                  icon={<ImageIcon className="h-4 w-4" />}
                />
                <ScoreIndicator
                  score={result.Safety_Score}
                  label="Safety & Ethics"
                  icon={<Shield className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
