import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Calendar, Image, Sparkles, Palette, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ColorDisplay } from "@/components/ColorDisplay";
import { useDeleteContent } from "@/hooks/useDeleteContent";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VideoDetails {
  id: string;
  created_at: string;
  prompt: string;
  video_url: string | null;
  status: string;
  brand_logo_url: string | null;
  product_image_url: string | null;
  brand_colors: string | null;
  aspect_ratio: string;
}

const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteVideo } = useDeleteContent();
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadVideoDetails();
  }, [id]);

  const loadVideoDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("generated_videos")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      setVideo(data);
    } catch (error) {
      console.error("Error loading video:", error);
      toast.error("Failed to load video details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!video?.video_url) return;
    
    try {
      const response = await fetch(video.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `video-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Video downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download video");
    }
  };

  const handleDelete = async () => {
    if (!id || !video) return;
    
    setDeleting(true);
    const success = await deleteVideo(
      id,
      video.video_url,
      video.brand_logo_url,
      video.product_image_url
    );
    
    if (success) {
      navigate('/');
    } else {
      setDeleting(false);
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

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Video not found</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb items={[{ label: "Videos", href: "/" }, { label: "Video Details" }]} />
      
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex gap-2">
          {video.video_url && video.status === "completed" && (
            <>
              <Button 
                variant="outline"
                onClick={() => navigate('/critique', { 
                  state: { 
                    mediaUrl: video.video_url,
                    mediaType: 'video',
                    brandColors: video.brand_colors ? video.brand_colors.split(', ') : [],
                    caption: video.prompt,
                    sourceType: 'generated_video',
                    sourceId: video.id
                  } 
                })}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Critique This
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={deleting}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Video</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this video? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Video Generation Details</CardTitle>
            <Badge className={getStatusColor(video.status)}>
              {video.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {video.video_url && video.status === "completed" && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                src={video.video_url}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created
              </h3>
              <p className="text-muted-foreground">
                {new Date(video.created_at).toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Prompt</h3>
              <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">
                {video.prompt}
              </p>
            </div>

            {video.brand_colors && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Brand Colors
                </h3>
                <ColorDisplay 
                  colors={video.brand_colors.split(', ')} 
                  showRemove={false}
                />
              </div>
            )}

            {(video.brand_logo_url || video.product_image_url) && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Materials Used
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {video.brand_logo_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Brand Logo</p>
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={video.brand_logo_url}
                          alt="Brand logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {video.product_image_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Product Image</p>
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={video.product_image_url}
                          alt="Product"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoDetails;
