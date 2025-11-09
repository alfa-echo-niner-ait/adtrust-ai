import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckCircle2, XCircle, Eye, Video, Image } from "lucide-react";
import { toast } from "sonner";

interface ApprovalCardProps {
  id: string;
  type: "video" | "poster";
  mediaUrl: string;
  prompt: string;
  status: string;
  createdAt: string;
  critiqueScores?: {
    brandFit: number;
    visualQuality: number;
    safety: number;
  };
  onStatusChange: () => void;
}

export const ApprovalCard = ({
  id,
  type,
  mediaUrl,
  prompt,
  status,
  createdAt,
  critiqueScores,
  onStatusChange,
}: ApprovalCardProps) => {
  const navigate = useNavigate();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/approval/${type}/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve content');
      }

      toast.success("Content approved successfully");
      onStatusChange();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve content");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/approval/${type}/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject content');
      }

      toast.success("Content rejected");
      onStatusChange();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject content");
    } finally {
      setLoading(false);
      setShowRejectForm(false);
      setRejectionReason("");
    }
  };

  const getReadyToPostBadge = () => {
    if (!critiqueScores) return null;
    const allScoresHigh = 
      critiqueScores.brandFit >= 8 &&
      critiqueScores.visualQuality >= 8 &&
      critiqueScores.safety >= 8;

    if (allScoresHigh) {
      return (
        <Badge className="bg-accent/20 text-accent-foreground border-accent/30">
          ✨ Ready to Post
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {type === "video" ? (
              <Video className="h-5 w-5 text-primary" />
            ) : (
              <Image className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-sm font-medium">{type === "video" ? "Video Ad" : "Poster Ad"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={status} size="sm" />
            {getReadyToPostBadge()}
          </div>
        </div>

        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          {type === "video" ? (
            <video src={mediaUrl} className="w-full h-full object-cover" controls />
          ) : (
            <img src={mediaUrl} alt="Poster" className="w-full h-full object-cover" />
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{prompt}</p>

        {critiqueScores && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{critiqueScores.brandFit.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Brand</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{critiqueScores.visualQuality.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Visual</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{critiqueScores.safety.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Safety</p>
            </div>
          </div>
        )}

        {showRejectForm ? (
          <div className="space-y-3 pt-2 border-t">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={loading}
                className="flex-1"
              >
                Confirm Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason("");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(type === "video" ? `/video/${id}` : `/poster/${id}`)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            {status === "pending_review" && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleApprove}
                  disabled={loading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};