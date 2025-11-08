import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Sparkles, Image as ImageIcon, Palette, FileText, Loader2, Video, Upload, Link2, Plus, X } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mediaSource = inputMethod === 'url' ? mediaUrl : uploadedFile;
    
    if (!mediaSource || brandColors.length === 0 || !caption) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and add at least one brand color.",
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
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    Brand Colors
                  </Label>
                  
                  {/* Color Picker */}
                  <div className="flex gap-2">
                    <div className="relative">
                      <Input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        disabled={loading}
                        className="w-16 h-10 cursor-pointer bg-secondary/50 border-border"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={addColorFromPicker}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Color
                    </Button>
                  </div>

                  {/* HEX Input */}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter HEX (e.g., #1E40AF)"
                      value={hexInput}
                      onChange={(e) => setHexInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColorFromHex())}
                      disabled={loading}
                      className="bg-secondary/50"
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

                  {/* Selected Colors Display */}
                  {brandColors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Selected Colors:</p>
                      <div className="flex flex-wrap gap-2">
                        {brandColors.map((color) => (
                          <div
                            key={color}
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary/50 hover:bg-secondary transition-colors"
                          >
                            <div
                              className="w-5 h-5 rounded border border-border shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm font-mono">{color}</span>
                            <button
                              type="button"
                              onClick={() => removeColor(color)}
                              disabled={loading}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Select colors using the picker or enter HEX codes
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
