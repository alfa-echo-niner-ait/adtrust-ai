import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, AlertCircle, Palette } from "lucide-react";

interface DetailedScoreBreakdownProps {
  scores: {
    brand_fit_score: number;
    visual_quality_score: number;
    message_clarity_score?: number;
    tone_of_voice_score?: number;
    safety_score: number;
  };
  brandValidation?: {
    color_match_percentage: number;
    logo_present: boolean;
    logo_correct: boolean;
    overall_consistency: number;
  };
  safetyBreakdown?: {
    harmful_content: number;
    stereotypes: number;
    misleading_claims: number;
  };
}

const ScoreBar = ({ score, label }: { score: number; label: string }) => {
  const percentage = score * 100;
  const getColor = (score: number) => {
    if (score >= 0.8) return "bg-success";
    if (score >= 0.6) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold">{score.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const StatusIcon = ({ passed }: { passed: boolean }) => {
  return passed ? (
    <CheckCircle2 className="h-4 w-4 text-success" />
  ) : (
    <XCircle className="h-4 w-4 text-destructive" />
  );
};

export const DetailedScoreBreakdown = ({ 
  scores, 
  brandValidation, 
  safetyBreakdown 
}: DetailedScoreBreakdownProps) => {
  return (
    <div className="space-y-6">
      {/* Main Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Comprehensive evaluation across 5 dimensions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreBar score={scores.brand_fit_score} label="Brand Alignment" />
          <ScoreBar score={scores.visual_quality_score} label="Visual Quality" />
          {scores.message_clarity_score !== undefined && (
            <ScoreBar score={scores.message_clarity_score} label="Message Clarity" />
          )}
          {scores.tone_of_voice_score !== undefined && (
            <ScoreBar score={scores.tone_of_voice_score} label="Tone of Voice" />
          )}
          <ScoreBar score={scores.safety_score} label="Safety & Ethics" />
        </CardContent>
      </Card>

      {/* Brand Validation */}
      {brandValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Brand Consistency Check
            </CardTitle>
            <CardDescription>Validation against provided brand assets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Brand Colors Match</span>
              <Badge variant={brandValidation.color_match_percentage >= 70 ? "default" : "secondary"}>
                {brandValidation.color_match_percentage}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Logo Present</span>
              <StatusIcon passed={brandValidation.logo_present} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Logo Correct</span>
              <StatusIcon passed={brandValidation.logo_correct} />
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Consistency</span>
                <span className="text-lg font-bold text-primary">
                  {(brandValidation.overall_consistency * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Breakdown */}
      {safetyBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Safety Analysis
            </CardTitle>
            <CardDescription>Granular safety and ethics evaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Harmful Content</span>
              <div className="flex items-center gap-2">
                <StatusIcon passed={safetyBreakdown.harmful_content >= 0.8} />
                <span className="text-sm font-medium">{(safetyBreakdown.harmful_content * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Stereotypes</span>
              <div className="flex items-center gap-2">
                <StatusIcon passed={safetyBreakdown.stereotypes >= 0.8} />
                <span className="text-sm font-medium">{(safetyBreakdown.stereotypes * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Misleading Claims</span>
              <div className="flex items-center gap-2">
                <StatusIcon passed={safetyBreakdown.misleading_claims >= 0.8} />
                <span className="text-sm font-medium">{(safetyBreakdown.misleading_claims * 100).toFixed(0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};