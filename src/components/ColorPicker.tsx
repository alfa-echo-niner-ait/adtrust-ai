import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Palette } from "lucide-react";
import { toast } from "sonner";

interface ColorPickerProps {
  onAddColor: (color: string) => void;
  disabled?: boolean;
}

export const ColorPicker = ({ onAddColor, disabled = false }: ColorPickerProps) => {
  const [currentColor, setCurrentColor] = useState("#1E40AF");
  const [hexInput, setHexInput] = useState("");

  const addColorFromPicker = () => {
    if (currentColor) {
      onAddColor(currentColor);
    }
  };

  const addColorFromHex = () => {
    const hexPattern = /^#[0-9A-F]{6}$/i;
    const colorValue = hexInput.startsWith("#") ? hexInput : `#${hexInput}`;
    
    if (hexPattern.test(colorValue)) {
      onAddColor(colorValue);
      setHexInput("");
    } else {
      toast.error("Please enter a valid HEX color (e.g., #1E40AF)");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addColorFromHex();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">Add Brand Colors</Label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Color Picker */}
        <div className="space-y-2">
          <Label htmlFor="colorPicker" className="text-xs text-muted-foreground">
            Color Picker
          </Label>
          <div className="flex gap-2">
            <div className="relative">
              <Input
                id="colorPicker"
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                disabled={disabled}
                className="h-11 w-14 cursor-pointer p-1 rounded-md"
              />
            </div>
            <Button
              type="button"
              onClick={addColorFromPicker}
              disabled={disabled}
              variant="outline"
              className="flex-1 h-11"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* HEX Input */}
        <div className="space-y-2">
          <Label htmlFor="hexInput" className="text-xs text-muted-foreground">
            Or Enter HEX Code
          </Label>
          <div className="flex gap-2">
            <Input
              id="hexInput"
              type="text"
              placeholder="#1E40AF"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className="font-mono text-sm h-11"
            />
            <Button
              type="button"
              onClick={addColorFromHex}
              disabled={disabled}
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
