import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ApprovalCard } from "@/components/ApprovalCard";
import { ClipboardList, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  type: "video" | "poster";
  mediaUrl: string;
  prompt: string;
  approvalStatus: string;
  createdAt: string;
  critiqueScores?: {
    brandFit: number;
    visualQuality: number;
    safety: number;
  };
}

const ReviewQueue = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);

      const { data: videos, error: videosError } = await supabase
        .from("generated_videos")
        .select(`
          id,
          video_url,
          prompt,
          approval_status,
          created_at,
          critique_id,
          critiques (
            brand_fit_score,
            visual_quality_score,
            safety_score
          )
        `)
        .not("video_url", "is", null)
        .order("created_at", { ascending: false });

      if (videosError) throw videosError;

      const { data: posters, error: postersError } = await supabase
        .from("generated_posters")
        .select(`
          id,
          poster_url,
          prompt,
          approval_status,
          created_at,
          critique_id,
          critiques (
            brand_fit_score,
            visual_quality_score,
            safety_score
          )
        `)
        .not("poster_url", "is", null)
        .order("created_at", { ascending: false });

      if (postersError) throw postersError;

      const videoItems: ContentItem[] = (videos || []).map((v: any) => ({
        id: v.id,
        type: "video" as const,
        mediaUrl: v.video_url,
        prompt: v.prompt,
        approvalStatus: v.approval_status || "pending_review",
        createdAt: v.created_at,
        critiqueScores: v.critiques
          ? {
              brandFit: v.critiques.brand_fit_score,
              visualQuality: v.critiques.visual_quality_score,
              safety: v.critiques.safety_score,
            }
          : undefined,
      }));

      const posterItems: ContentItem[] = (posters || []).map((p: any) => ({
        id: p.id,
        type: "poster" as const,
        mediaUrl: p.poster_url,
        prompt: p.prompt,
        approvalStatus: p.approval_status || "pending_review",
        createdAt: p.created_at,
        critiqueScores: p.critiques
          ? {
              brandFit: p.critiques.brand_fit_score,
              visualQuality: p.critiques.visual_quality_score,
              safety: p.critiques.safety_score,
            }
          : undefined,
      }));

      setItems([...videoItems, ...posterItems].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Error loading items:", error);
      toast.error("Failed to load review queue");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "pending") return item.approvalStatus === "pending_review";
    if (filter === "approved") return item.approvalStatus === "approved" || item.approvalStatus === "auto_approved";
    if (filter === "rejected") return item.approvalStatus === "rejected";
    return true;
  });

  const stats = {
    pending: items.filter((i) => i.approvalStatus === "pending_review").length,
    approved: items.filter((i) => i.approvalStatus === "approved" || i.approvalStatus === "auto_approved").length,
    rejected: items.filter((i) => i.approvalStatus === "rejected").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Review Queue" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Review Queue
          </h1>
          <p className="text-muted-foreground mt-2">
            Approve or reject generated content before publishing
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Review</CardTitle>
          <CardDescription>Review and approve generated ads</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All ({items.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No items to review</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <ApprovalCard
                      key={`${item.type}-${item.id}`}
                      id={item.id}
                      type={item.type}
                      mediaUrl={item.mediaUrl}
                      prompt={item.prompt}
                      status={item.approvalStatus}
                      createdAt={item.createdAt}
                      critiqueScores={item.critiqueScores}
                      onStatusChange={loadItems}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewQueue;