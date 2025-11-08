import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ScoreIndicatorProps {
  score: number;
  label: string;
  icon: React.ReactNode;
}

export function ScoreIndicator({ score, label, icon }: ScoreIndicatorProps) {
  const percentage = Math.round(score * 100);
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'destructive';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle2 className="h-5 w-5" />;
    if (score >= 0.6) return <AlertTriangle className="h-5 w-5" />;
    return <XCircle className="h-5 w-5" />;
  };

  const scoreColor = getScoreColor(score);
  const scoreIcon = getScoreIcon(score);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-secondary/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Badge 
          variant={scoreColor === 'success' ? 'default' : scoreColor === 'warning' ? 'secondary' : 'destructive'}
          className="gap-1"
        >
          {scoreIcon}
          {percentage}%
        </Badge>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            scoreColor === 'success' && "bg-success",
            scoreColor === 'warning' && "bg-warning",
            scoreColor === 'destructive' && "bg-destructive"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
