import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ColorDisplayProps {
  colors: string[];
  onRemoveColor?: (color: string) => void;
  disabled?: boolean;
  showRemove?: boolean;
}

export const ColorDisplay = ({ 
  colors, 
  onRemoveColor, 
  disabled = false,
  showRemove = true 
}: ColorDisplayProps) => {
  if (colors.length === 0) {
    return (
      <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg bg-secondary/20">
        <p className="text-sm text-muted-foreground">No colors added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Selected Colors ({colors.length})
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {colors.map((color, index) => (
          <div
            key={`${color}-${index}`}
            className="relative flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
          >
            <div
              className="w-10 h-10 rounded-md border-2 border-border shadow-sm shrink-0"
              style={{ backgroundColor: color }}
              title={color}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono font-medium text-foreground">
                {color.toUpperCase()}
              </p>
            </div>
            {showRemove && onRemoveColor && (
              <Button
                type="button"
                onClick={() => onRemoveColor(color)}
                disabled={disabled}
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive z-10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
