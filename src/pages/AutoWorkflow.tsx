import { useState } from "react";
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
import { Sparkles, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AutoWorkflow = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<"video" | "poster">("video");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [brandColors, setBrandColors] = useState<string[]>([]);
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

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

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleStart = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setRunning(true);
    try {
      let brandLogoUrl = null;
      let productImageUrl = null;

      if (brandLogo) {
        brandLogoUrl = await uploadFile(brandLogo, "video-assets");
      }

      if (productImage) {
        productImageUrl = await uploadFile(productImage, "video-assets");
      }

      const { data: workflowData, error: workflowError } = await supabase
        .from("workflow_runs")
        .insert({
          content_type: contentType,
          prompt,
          brand_logo_url: brandLogoUrl,
          product_image_url: productImageUrl,
          brand_colors: brandColors.length > 0 ? brandColors.join(", ") : null,
          aspect_ratio: aspectRatio,
        })
        .select()
        .single();

      if (workflowError) throw workflowError;

      setWorkflowId(workflowData.id);

      const { error: functionError } = await supabase.functions.invoke("auto-workflow", {
        body: { workflowId: workflowData.id },
      });

      if (functionError) throw functionError;

      toast.success("Multi-agent workflow started!");
    } catch (error) {
      console.error("Error starting workflow:", error);
      toast.error("Failed to start workflow");
      setRunning(false);
      setWorkflowId(null);
    }
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

            <div className="space-y-3">
              <ColorPicker onAddColor={handleAddColor} disabled={running} />
              {brandColors.length > 0 && (
                <ColorDisplay
                  colors={brandColors}
                  onRemoveColor={handleRemoveColor}
                  showRemove={!running}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo">Brand Logo (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBrandLogo(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={running}
                  />
                  <label htmlFor="logo" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {brandLogo ? brandLogo.name : "Upload brand logo"}
                    </p>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Product Image (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    id="product"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProductImage(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={running}
                  />
                  <label htmlFor="product" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {productImage ? productImage.name : "Upload product image"}
                    </p>
                  </label>
                </div>
              </div>
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