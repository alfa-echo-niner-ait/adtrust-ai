import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Sparkles, Image as ImageIcon, Palette, FileText, Loader2, Video, Upload, Trash2, Plus } from 'lucide-react';
import { ColorPicker } from '@/components/ColorPicker';
import { ColorDisplay } from '@/components/ColorDisplay';
import { extractColorsFromImage, extractColorsFromVideo } from '@/lib/colorExtraction';
import { useCritique } from '@/hooks/useCritique';
import { ScoreIndicator } from '@/components/ScoreIndicator';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function CritiqueAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [extractingColors, setExtractingColors] = useState(false);
  
  const { loading, error, result, runCritique } = useCritique();
  const { toast } = useToast();

  // Pre-fill from generated content
  useEffect(() => {
    if (location.state) {
      if (location.state.mediaUrl) setMediaUrl(location.state.mediaUrl);
      if (location.state.mediaType) setMediaType(location.state.mediaType);
      if (location.state.brandColors) setBrandColors(location.state.brandColors);
      if (location.state.caption) setCaption(location.state.caption);
      // Mark as uploaded so user can see preview
      if (location.state.mediaUrl) {
        setUploadedFile(new File([], "pre-filled-media"));
      }
    }
  }, [location.state]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      
      // Extract colors from images or videos
      setExtractingColors(true);
      try {
        const colors = mediaType === 'image' 
          ? await extractColorsFromImage(file, 5)
          : await extractColorsFromVideo(file, 5);
        
        setSuggestedColors(colors);
        toast({
          title: "Colors Extracted",
          description: `Found ${colors.length} dominant colors from ${mediaType}`,
        });
      } catch (error) {
        console.error('Error extracting colors:', error);
        toast({
          title: "Extraction Failed",
          description: `Could not extract colors from ${mediaType}`,
          variant: "destructive",
        });
      } finally {
        setExtractingColors(false);
      }
    }
  };

  const handleAddSuggestedColors = () => {
    const newColors = suggestedColors.filter(color => !brandColors.includes(color));
    if (newColors.length > 0) {
      setBrandColors([...brandColors, ...newColors]);
      setSuggestedColors([]); // Clear suggestions after adding
      toast({
        title: "Colors Added",
        description: `Added ${newColors.length} colors`,
      });
    }
  };

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

  const clearMedia = () => {
    setMediaUrl('');
    setUploadedFile(null);
    setSuggestedColors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedFile || brandColors.length === 0 || !caption) {
      toast({
        title: "Missing Information",
        description: "Please upload media, add at least one brand color, and provide a caption.",
        variant: "destructive",
      });
      return;
    }

    const critiqueId = await runCritique({ 
      mediaUrl, 
      brandColors: brandColors.join(', '), 
      caption,
      mediaType,
      sourceType: location.state?.sourceType,
      sourceId: location.state?.sourceId
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
      <Breadcrumb items={[{ label: "Critique Analysis" }]} />
      
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gradient mb-2">AI Ad Critique</h1>
          <p className="text-muted-foreground text-lg">Upload your ad creative for instant AI-powered analysis and actionable insights</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mediaType === 'image' ? <ImageIcon className="h-5 w-5 text-primary" /> : <Video className="h-5 w-5 text-primary" />}
              Ad Media
            </CardTitle>
            <CardDescription>
              Upload your {mediaType} file for comprehensive analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Media Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Media Type *</Label>
              <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as 'image' | 'video')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image" className="gap-2" disabled={!!uploadedFile || loading}>
                    <ImageIcon className="h-4 w-4" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2" disabled={!!uploadedFile || loading}>
                    <Video className="h-4 w-4" />
                    Video
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Media Upload */}
            {!uploadedFile ? (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50 border-border transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mediaType === 'image' ? 'PNG, JPG, WEBP (MAX. 20MB)' : 'MP4, MOV, AVI (MAX. 20MB)'}
                    </p>
                  </div>
                  <Input
                    id="dropzone-file"
                    type="file"
                    accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="relative rounded-lg overflow-hidden bg-secondary/30 border border-border">
                  {mediaType === 'image' ? (
                    <img
                      src={mediaUrl}
                      alt="Ad preview"
                      className="w-full h-auto max-h-96 object-contain"
                      onError={() => {
                        toast({
                          title: "Invalid Image",
                          description: "Failed to load image. Please check the file.",
                          variant: "destructive",
                        });
                      }}
                    />
                  ) : (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full h-auto max-h-96"
                      onError={() => {
                        toast({
                          title: "Invalid Video",
                          description: "Failed to load video. Please check the file.",
                          variant: "destructive",
                        });
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>

                {/* File Info & Clear */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    {mediaType === 'image' ? <ImageIcon className="h-5 w-5 text-primary" /> : <Video className="h-5 w-5 text-primary" />}
                    <div>
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearMedia}
                    disabled={loading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Suggested Colors from Media */}
            {suggestedColors.length > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Suggested Colors from {mediaType === 'image' ? 'Image' : 'Video'}</p>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleAddSuggestedColors}
                    className="gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
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

            {/* Brand Colors Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Brand Colors *</Label>
                {extractingColors && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Extracting colors...
                  </span>
                )}
              </div>
              
              <ColorPicker onAddColor={handleAddColor} disabled={loading} />
              
              <ColorDisplay 
                colors={brandColors} 
                onRemoveColor={handleRemoveColor}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Caption & Submit Section */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Ad Caption & Messaging
            </CardTitle>
            <CardDescription>
              Enter the text content and messaging from your advertisement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="caption" className="text-sm font-medium">Caption *</Label>
                <Textarea
                  id="caption"
                  placeholder="e.g., 'Discover the future of innovation. Limited time offer - 50% off!'"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={loading}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <Separator />

              <Button
                type="submit"
                disabled={loading || !uploadedFile || brandColors.length === 0 || !caption}
                className="w-full gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing Ad...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Run AI Critique
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <strong>Error:</strong> {error}
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
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
                {result.MessageClarity_Score !== undefined && (
                  <ScoreIndicator
                    score={result.MessageClarity_Score}
                    label="Message Clarity"
                    icon={<FileText className="h-4 w-4" />}
                  />
                )}
                {result.ToneOfVoice_Score !== undefined && (
                  <ScoreIndicator
                    score={result.ToneOfVoice_Score}
                    label="Tone of Voice"
                    icon={<Sparkles className="h-4 w-4" />}
                  />
                )}
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
