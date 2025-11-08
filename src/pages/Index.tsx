import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Sparkles, Image as ImageIcon, Palette, FileText, Loader2, Copy, CheckCheck } from 'lucide-react';
import { useCritique } from '@/hooks/useCritique';
import { ScoreIndicator } from '@/components/ScoreIndicator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Index = () => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [brandColors, setBrandColors] = useState('');
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { loading, error, result, runCritique } = useCritique();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mediaUrl || !brandColors || !caption) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before running the critique.",
        variant: "destructive",
      });
      return;
    }

    await runCritique({ mediaUrl, brandColors, caption });
  };

  const handleCopyPrompt = async () => {
    if (result?.Refinement_Prompt_Suggestion) {
      await navigator.clipboard.writeText(result.Refinement_Prompt_Suggestion);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Refinement prompt has been copied successfully.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-glow">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">BrandGuard AI</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Ad Critique & Optimization</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-8">
          {/* Input Section */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                1. Configure Brand Kit & Submit Ad
              </CardTitle>
              <CardDescription>
                Define your brand parameters and provide the ad media for AI critique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Media URL */}
                  <div className="space-y-2">
                    <Label htmlFor="mediaUrl" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      Image/Video URL
                    </Label>
                    <Input
                      id="mediaUrl"
                      type="url"
                      placeholder="https://example.com/ad-image.jpg"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      disabled={loading}
                      className="bg-secondary/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide a direct link to your ad image or video
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

          {/* Output Section */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                2. AI Critique Scorecard & Refinement
              </CardTitle>
              <CardDescription>
                Comprehensive analysis and optimization recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !loading && (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Submit your ad details above to receive a comprehensive AI critique
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Scores Grid */}
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

                  {/* Critique Summary */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Critique Summary
                    </h3>
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {result.Critique_Summary}
                      </p>
                    </div>
                  </div>

                  {/* Refinement Prompt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Next-Gen Prompt
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPrompt}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <CheckCheck className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Prompt
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border font-mono text-sm overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-foreground/90">
                        {result.Refinement_Prompt_Suggestion}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            Built for Hack-Nation's Global AI Hackathon 2025 • MIT Sloan AI Club
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
