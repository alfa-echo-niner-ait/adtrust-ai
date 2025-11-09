import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ColorPicker } from "@/components/ColorPicker";
import { ColorDisplay } from "@/components/ColorDisplay";
import { Breadcrumb } from "@/components/Breadcrumb";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { Sparkles, Loader2, Upload, X, Palette } from "lucide-react";
import { toast } from "sonner";
import { useWorkflow } from "@/hooks/useWorkflow";
import { extractColorsFromImage } from "@/lib/colorExtraction";

const AutoWorkflow = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<"video" | "poster">("video");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const { loading: running, error, result, runWorkflow } = useWorkflow();
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [extractingColors, setExtractingColors] = useState(false);

  useEffect(() => {
    if (result) {
      setWorkflowId(result.workflow_id);
      toast.success("Multi-agent workflow started!");
    }
    if (error) {
      toast.error(error);
    }
  }, [result, error]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') {
          setBrandLogo(file);
          setBrandLogoPreview(reader.result as string);
        } else {
          setProductImage(file);
          setProductImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Extract colors from image
      setExtractingColors(true);
      try {
        const colors = await extractColorsFromImage(file, 5);
        setSuggestedColors(colors);
        toast.success(`Extracted ${colors.length} colors from image`);
      } catch (error) {
        console.error('Error extracting colors:', error);
        toast.error('Failed to extract colors from image');
      } finally {
        setExtractingColors(false);
      }
    }
  };

  const handleRemoveFile = (type: 'logo' | 'product') => {
    if (type === 'logo') {
      setBrandLogo(null);
      setBrandLogoPreview(null);
    } else {
      setProductImage(null);
      setProductImagePreview(null);
    }
    // Clear suggested colors when all images are removed
    if ((type === 'logo' && !productImage) || (type === 'product' && !brandLogo)) {
      setSuggestedColors([]);
    }
  };

  const handleAddSuggestedColors = () => {
    const newColors = suggestedColors.filter(color => !brandColors.includes(color));
    if (newColors.length > 0) {
      setBrandColors([...brandColors, ...newColors]);
      setSuggestedColors([]); // Clear suggestions
      toast.success(`Added ${newColors.length} colors`);
    } else {
      toast.info('All suggested colors already added');
    }
  };

  const aspectRatios = contentType === "video"
    ? [{ value: "16:9", label: "16:9 (Landscape)" }, { value: "9:16", label: "9:16 (Portrait)" }]
    : [
        { value: "1:1", label: "1:1 (Square)" },
        { value: "3:4", label: "3:4 (Portrait)" },
        { value: "4:3", label: "4:3 (Landscape)" },
        { value: "9:16", label: "9:16 (Story)" },
        { value: "16:9", label: "16:9 (Wide)" },
      ];

  const handleAddColor = (color: string) => {
    if (!brandColors.includes(color)) {
      setBrandColors([...brandColors, color]);
    } else {
      toast.error("Color already added");
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setBrandColors(brandColors.filter((color) => color !== colorToRemove));
  };

  const handleStart = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (brandLogo || productImage) {
      toast.info("File uploads are not yet supported in this version.");
    }

    await runWorkflow({
      prompt,
      brandColors,
      brandName: "Brand", // This should be dynamic
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Auto Workflow" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Multi-Agent Workflow
          </h1>
          <p className="text-muted-foreground mt-2">
            Automatically generate → critique → refine until quality scores exceed 0.8
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>

      {workflowId ? (
        <WorkflowProgress workflowId={workflowId} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configure Workflow</CardTitle>
            <CardDescription>
              The AI will iterate up to 3 times until all quality scores reach 8/10
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <RadioGroup value={contentType} onValueChange={(v) => setContentType(v as "video" | "poster")} disabled={running}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="video" />
                  <Label htmlFor="video">Video Ad</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poster" id="poster" />
                  <Label htmlFor="poster">Poster Ad</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt *</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the ad you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                disabled={running}
              />
            </div>

            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <RadioGroup value={aspectRatio} onValueChange={setAspectRatio} disabled={running}>
                {aspectRatios.map((ratio) => (
                  <div key={ratio.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={ratio.value} id={ratio.value} />
                    <Label htmlFor={ratio.value}>{ratio.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo">Brand Logo (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg overflow-hidden bg-muted/20">
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                    className="hidden"
                    disabled={running}
                  />
                  {brandLogoPreview ? (
                    <div className="relative aspect-square group">
                      <img
                        src={brandLogoPreview}
                        alt="Brand logo preview"
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label htmlFor="logo" className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">
                          Change
                        </label>
                        <Button
                          type="button"
                          onClick={() => handleRemoveFile('logo')}
                          variant="destructive"
                          size="sm"
                          disabled={running}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="logo" className="cursor-pointer p-6 text-center aspect-square flex flex-col items-center justify-center">
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload brand logo</p>
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Product Image (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg overflow-hidden bg-muted/20">
                  <input
                    id="product"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'product')}
                    className="hidden"
                    disabled={running}
                  />
                  {productImagePreview ? (
                    <div className="relative aspect-square group">
                      <img
                        src={productImagePreview}
                        alt="Product preview"
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label htmlFor="product" className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">
                          Change
                        </label>
                        <Button
                          type="button"
                          onClick={() => handleRemoveFile('product')}
                          variant="destructive"
                          size="sm"
                          disabled={running}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="product" className="cursor-pointer p-6 text-center aspect-square flex flex-col items-center justify-center">
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload product image</p>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Brand Colors</Label>
                {extractingColors && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Extracting colors...
                  </span>
                )}
              </div>
              
              {suggestedColors.length > 0 && (
                <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Suggested Colors from Image
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSuggestedColors}
                      disabled={running}
                    >
                      Add All
                    </Button>
                  </div>
                  <ColorDisplay
                    colors={suggestedColors}
                    onRemoveColor={() => {}}
                    showRemove={false}
                  />
                </div>
              )}

              <ColorPicker onAddColor={handleAddColor} disabled={running} />
              {brandColors.length > 0 && (
                <ColorDisplay
                  colors={brandColors}
                  onRemoveColor={handleRemoveColor}
                  showRemove={!running}
                />
              )}
            </div>

            <Button onClick={handleStart} disabled={running} className="w-full" size="lg">
              {running ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting Workflow...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Multi-Agent Workflow
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoWorkflow;