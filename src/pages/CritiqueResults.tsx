import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Sparkles, Image as ImageIcon, Palette, FileText, Copy, CheckCheck, ArrowLeft } from 'lucide-react';
import { ScoreIndicator } from '@/components/ScoreIndicator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CritiqueData {
  id: string;
  media_url: string;
  media_type: string;
  brand_colors: string;
  caption: string;
  brand_fit_score: number;
  visual_quality_score: number;
  safety_score: number;
  critique_summary: string;
  refinement_prompt: string;
  created_at: string;
}

export default function CritiqueResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [critique, setCritique] = useState<CritiqueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadCritique();
    }
  }, [id]);

  const loadCritique = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('critiques')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCritique(data);
    } catch (error) {
      console.error('Error loading critique:', error);
      toast({
        title: "Error",
        description: "Failed to load critique results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (critique?.refinement_prompt) {
      await navigator.clipboard.writeText(critique.refinement_prompt);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Refinement prompt has been copied successfully.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center py-16 text-muted-foreground">Loading critique results...</div>
      </div>
    );
  }

  if (!critique) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Critique not found</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold text-gradient">Critique Results</h1>
            <p className="text-muted-foreground mt-2">
              Generated on {new Date(critique.created_at).toLocaleDateString()} at{' '}
              {new Date(critique.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Scores */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Scorecard
            </CardTitle>
            <CardDescription>AI-powered analysis of your ad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <ScoreIndicator
                score={critique.brand_fit_score}
                label="Brand Fit"
                icon={<Palette className="h-4 w-4" />}
              />
              <ScoreIndicator
                score={critique.visual_quality_score}
                label="Visual Quality"
                icon={<ImageIcon className="h-4 w-4" />}
              />
              <ScoreIndicator
                score={critique.safety_score}
                label="Safety & Ethics"
                icon={<Shield className="h-4 w-4" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Critique Summary */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Critique Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm leading-relaxed text-foreground/90">
                {critique.critique_summary}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Refinement Prompt */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Next-Gen Prompt
              </CardTitle>
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
            <CardDescription>
              Use this optimized prompt to regenerate your ad with improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-muted/50 border border-border font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap text-foreground/90">
                {critique.refinement_prompt}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Ad Details */}
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle>Ad Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">Media Type</div>
              <div className="text-sm text-muted-foreground">{critique.media_type}</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Brand Colors</div>
              <div className="text-sm text-muted-foreground">{critique.brand_colors}</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Caption</div>
              <div className="text-sm text-muted-foreground">{critique.caption}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
