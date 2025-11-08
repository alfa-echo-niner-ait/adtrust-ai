import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Sparkles, Image as ImageIcon, Palette, FileText, Loader2, Video, Upload, Plus, X, Trash2 } from 'lucide-react';
import { useCritique } from '@/hooks/useCritique';
import { ScoreIndicator } from '@/components/ScoreIndicator';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

export default function CritiqueAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [currentColor, setCurrentColor] = useState('#1E40AF');
  const [hexInput, setHexInput] = useState('');
  const [caption, setCaption] = useState('');
  
  const { loading, error, result, runCritique } = useCritique();
  const { toast } = useToast();

  // Check if we're coming from video generation
  useEffect(() => {
    if (location.state?.videoUrl) {
      setMediaUrl(location.state.videoUrl);
      setMediaType('video');
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

  const addColorFromPicker = () => {
    if (currentColor && !brandColors.includes(currentColor)) {
      setBrandColors([...brandColors, currentColor]);
    }
  };

  const addColorFromHex = () => {
    const hexPattern = /^#[0-9A-F]{6}$/i;
    const colorValue = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    
    if (hexPattern.test(colorValue) && !brandColors.includes(colorValue)) {
      setBrandColors([...brandColors, colorValue]);
      setHexInput('');
    } else {
      toast({
        title: "Invalid Color",
        description: "Please enter a valid HEX color code (e.g., #1E40AF)",
        variant: "destructive",
      });
    }
  };

  const removeColor = (colorToRemove: string) => {
    setBrandColors(brandColors.filter(color => color !== colorToRemove));
  };

  const clearMedia = () => {
    setMediaUrl('');
    setUploadedFile(null);
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Critique Analysis</h1>
          <p className="text-muted-foreground">Submit your ad for AI-powered critique and optimization</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Media Upload & Preview */}
          <Card className="border-border shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {mediaType === 'image' ? <ImageIcon className="h-5 w-5 text-primary" /> : <Video className="h-5 w-5 text-primary" />}
                Ad Media
              </CardTitle>
              <CardDescription>
                Upload your {mediaType} file for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Media Type Selection */}
              <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as 'image' | 'video')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image" className="gap-2" disabled={!!uploadedFile}>
                    <ImageIcon className="h-4 w-4" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2" disabled={!!uploadedFile}>
                    <Video className="h-4 w-4" />
                    Video
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Media Upload */}
              {!uploadedFile ? (
                <div className="space-y-2">
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
                            description: "Failed to load image. Please check the URL.",
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
                            description: "Failed to load video. Please check the URL.",
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
            </CardContent>
          </Card>

          {/* Right Column - Brand Details */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Brand Details
              </CardTitle>
              <CardDescription>
                Define your brand identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Brand Colors */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Brand Colors</Label>
                
                {/* Color Picker */}
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    disabled={loading}
                    className="w-14 h-10 cursor-pointer p-1"
                  />
                  <Button
                    type="button"
                    onClick={addColorFromPicker}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* HEX Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="#1E40AF"
                    value={hexInput}
                    onChange={(e) => setHexInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColorFromHex())}
                    disabled={loading}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    onClick={addColorFromHex}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Selected Colors */}
                {brandColors.length > 0 ? (
                  <div className="space-y-2 p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-xs font-medium text-muted-foreground">Selected ({brandColors.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {brandColors.map((color) => (
                        <div
                          key={color}
                          className="group relative"
                        >
                          <div
                            className="w-10 h-10 rounded-md border-2 border-border shadow-sm cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            disabled={loading}
                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    No colors added yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Caption & Submit */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Ad Caption
            </CardTitle>
            <CardDescription>
              Provide the text content and messaging from your ad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                id="caption"
                placeholder="Enter your ad copy and messaging here..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={loading}
                rows={4}
                className="resize-none"
              />

              <Separator />

              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Run Critique
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
