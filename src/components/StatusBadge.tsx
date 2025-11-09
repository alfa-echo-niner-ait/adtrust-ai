import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, Sparkles } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "default" | "lg";
}

export const StatusBadge = ({ status, size = "default" }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    const normalized = status.toLowerCase().replace(/_/g, ' ');
    
    switch (normalized) {
      case "completed":
      case "approved":
        return {
          label: "Completed",
          className: "bg-success/20 text-success-foreground border-success/30",
          icon: CheckCircle2,
        };
      case "pending":
      case "pending review":
        return {
          label: "Pending Review",
          className: "bg-warning/20 text-warning-foreground border-warning/30",
          icon: Clock,
        };
      case "failed":
      case "rejected":
        return {
          label: status === "rejected" ? "Rejected" : "Failed",
          className: "bg-destructive/20 text-destructive-foreground border-destructive/30",
          icon: XCircle,
        };
      case "running":
      case "processing":
        return {
          label: "Processing",
          className: "bg-primary/20 text-primary border-primary/30",
          icon: Sparkles,
        };
      case "auto approved":
        return {
          label: "Auto Approved",
          className: "bg-accent/20 text-accent-foreground border-accent/30",
          icon: Sparkles,
        };
      default:
        return {
          label: status,
          className: "bg-muted text-muted-foreground border-border",
          icon: AlertCircle,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} gap-1.5 ${size === "sm" ? "text-xs px-2 py-0.5" : size === "lg" ? "text-base px-4 py-2" : ""}`}
    >
      <Icon className={iconSize} />
      {config.label}
    </Badge>
  );
};