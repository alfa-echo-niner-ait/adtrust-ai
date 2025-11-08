import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Shield, Plus, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface GeneratedVideo {
  id: string;
  prompt: string;
  status: string;
  video_url: string | null;
  created_at: string;
}

interface Critique {
  id: string;
  media_type: string;
  brand_fit_score: number;
  visual_quality_score: number;
  safety_score: number;
  created_at: string;
}

export default function Dashboard() {
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [critiques, setCritiques] = useState<Critique[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [videosResult, critiquesResult] = await Promise.all([
        supabase
          .from('generated_videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('critiques')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (videosResult.error) throw videosResult.error;
      if (critiquesResult.error) throw critiquesResult.error;

      setVideos(videosResult.data || []);
      setCritiques(critiquesResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Overview of your generated videos and critiques</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/generate')} className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Video
            </Button>
            <Button onClick={() => navigate('/critique')} variant="outline" className="gap-2">
              <Shield className="h-4 w-4" />
              Critique Ad
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{videos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Critiques</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{critiques.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Safety Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {critiques.length > 0
                  ? (critiques.reduce((sum, c) => sum + (c.safety_score || 0), 0) / critiques.length).toFixed(2)
                  : '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Generated Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Recent Videos
              </CardTitle>
              <CardDescription>Latest generated video ads</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : videos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No videos generated yet. Start by creating your first video!
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div key={video.id} className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getStatusColor(video.status)}>{video.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 mb-3">{video.prompt}</p>
                      {video.video_url && video.status === 'completed' && (
                        <Button size="sm" variant="outline" className="w-full gap-2">
                          <Eye className="h-4 w-4" />
                          Preview Video
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Critiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Recent Critiques
              </CardTitle>
              <CardDescription>Latest ad critiques and analyses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : critiques.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No critiques yet. Submit an ad for critique!
                </div>
              ) : (
                <div className="space-y-4">
                  {critiques.map((critique) => (
                    <div
                      key={critique.id}
                      className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/results/${critique.id}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">{critique.media_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(critique.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Brand Fit</div>
                          <div className={`font-semibold ${getScoreColor(critique.brand_fit_score)}`}>
                            {(critique.brand_fit_score * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Visual</div>
                          <div className={`font-semibold ${getScoreColor(critique.visual_quality_score)}`}>
                            {(critique.visual_quality_score * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Safety</div>
                          <div className={`font-semibold ${getScoreColor(critique.safety_score)}`}>
                            {(critique.safety_score * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
