import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Video, FileText, TrendingUp, Image as ImageIcon, Workflow, ClipboardList } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";

interface GeneratedVideo {
  id: string;
  prompt: string;
  status: string;
  video_url: string | null;
  created_at: string;
}

interface Critique {
  id: string;
  created_at: string;
  media_url: string;
  media_type: string;
  brand_fit_score: number;
  visual_quality_score: number;
  safety_score: number;
}

interface GeneratedPoster {
  id: string;
  created_at: string;
  prompt: string;
  poster_url: string | null;
  status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [critiques, setCritiques] = useState<Critique[]>([]);
  const [posters, setPosters] = useState<GeneratedPoster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: videosData, error: videosError } = await supabase
        .from("generated_videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (videosError) throw videosError;

      const { data: critiquesData, error: critiquesError } = await supabase
        .from("critiques")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (critiquesError) throw critiquesError;

      const { data: postersData, error: postersError } = await supabase
        .from("generated_posters")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (postersError) throw postersError;

      setVideos(videosData || []);
      setCritiques(critiquesData || []);
      setPosters(postersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "failed":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gradient">AdTrust</h1>
          <p className="text-muted-foreground mt-2">
            AI-Powered Quality Control for Generated Ads
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => navigate("/auto-workflow")} className="gradient-primary shadow-glow">
            <Workflow className="mr-2 h-4 w-4" />
            Auto Workflow
          </Button>
          <Button onClick={() => navigate("/review-queue")} variant="outline">
            <ClipboardList className="mr-2 h-4 w-4" />
            Review Queue
          </Button>
          <Button onClick={() => navigate("/critique")} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Critique Ad
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Total Posters</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Critiques</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{critiques.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Safety Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {critiques.length > 0
                ? (
                    critiques.reduce((acc, c) => acc + (c.safety_score || 0), 0) /
                    critiques.length
                  ).toFixed(1)
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Recent Videos
            </CardTitle>
            <CardDescription>Latest video generations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : videos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No videos generated yet
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/video/${video.id}`)}
                  >
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {video.video_url && video.status === "completed" ? (
                        <video
                          src={video.video_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <Video className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <Badge className={getStatusColor(video.status)}>
                        {video.status}
                      </Badge>
                      <p className="text-sm line-clamp-2">{video.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(video.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Recent Posters
            </CardTitle>
            <CardDescription>Latest poster generations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : posters.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No posters generated yet
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posters.map((poster) => (
                  <div
                    key={poster.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/poster/${poster.id}`)}
                  >
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {poster.poster_url && poster.status === "completed" ? (
                        <img
                          src={poster.poster_url}
                          alt="Poster"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <Badge className={getStatusColor(poster.status)}>
                        {poster.status}
                      </Badge>
                      <p className="text-sm line-clamp-2">{poster.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(poster.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Critiques
            </CardTitle>
            <CardDescription>Latest ad analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : critiques.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No critiques yet
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {critiques.map((critique) => (
                  <div
                    key={critique.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/results/${critique.id}`)}
                  >
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {critique.media_type === "video" ? (
                        <video
                          src={critique.media_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={critique.media_url}
                          alt="Critique"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{critique.media_type}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(critique.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Brand</p>
                          <p
                            className={`text-sm font-semibold ${getScoreColor(
                              critique.brand_fit_score
                            )}`}
                          >
                            {critique.brand_fit_score}/10
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Visual</p>
                          <p
                            className={`text-sm font-semibold ${getScoreColor(
                              critique.visual_quality_score
                            )}`}
                          >
                            {critique.visual_quality_score}/10
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Safety</p>
                          <p
                            className={`text-sm font-semibold ${getScoreColor(
                              critique.safety_score
                            )}`}
                          >
                            {critique.safety_score}/10
                          </p>
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
  );
};

export default Dashboard;
