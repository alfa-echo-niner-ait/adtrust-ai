import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Calendar, Image, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ColorDisplay } from "@/components/ColorDisplay";

interface PosterDetails {
  id: string;
  created_at: string;
  prompt: string;
  poster_url: string | null;
  status: string;
  brand_logo_url: string | null;
  product_image_url: string | null;
  brand_colors: string | null;
  dimensions: string;
}

const PosterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poster, setPoster] = useState<PosterDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosterDetails();
  }, [id]);

  const loadPosterDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("generated_posters")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPoster(data);
    } catch (error) {
      console.error("Error loading poster:", error);
      toast.error("Failed to load poster details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!poster?.poster_url) return;
    
    try {
      const response = await fetch(poster.poster_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `poster-${poster.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Poster downloaded");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download poster");
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

  if (!poster) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Poster not found</p>
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
      <Breadcrumb items={[{ label: "Posters", href: "/" }, { label: "Poster Details" }]} />
      
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex gap-2">
          {poster.poster_url && poster.status === "completed" && (
            <>
              <Button 
                variant="outline"
                onClick={() => navigate('/critique', { 
                  state: { 
                    mediaUrl: poster.poster_url,
                    mediaType: 'image',
                    brandColors: poster.brand_colors ? poster.brand_colors.split(', ') : [],
                    caption: poster.prompt,
                    sourceType: 'generated_poster',
                    sourceId: poster.id
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
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Poster Generation Details</CardTitle>
            <Badge className={getStatusColor(poster.status)}>
              {poster.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {poster.poster_url && poster.status === "completed" && (
            <div className="max-w-2xl mx-auto bg-muted rounded-lg overflow-hidden">
              <img
                src={poster.poster_url}
                alt="Generated poster"
                className="w-full h-auto object-contain"
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
                {new Date(poster.created_at).toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Prompt</h3>
              <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">
                {poster.prompt}
              </p>
            </div>

            {poster.brand_colors && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Brand Colors
                </h3>
                <ColorDisplay 
                  colors={poster.brand_colors.split(', ')} 
                  showRemove={false}
                />
              </div>
            )}

            {(poster.brand_logo_url || poster.product_image_url) && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Materials Used
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {poster.brand_logo_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Brand Logo</p>
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={poster.brand_logo_url}
                          alt="Brand logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {poster.product_image_url && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Product Image</p>
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={poster.product_image_url}
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

export default PosterDetails;
