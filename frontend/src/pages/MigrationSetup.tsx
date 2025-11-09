import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Database, Key, FileCode, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const MigrationSetup = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    supabaseUrl: "",
    anonKey: "",
    serviceRoleKey: ""
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const databaseSchema = `-- Critiques Table
CREATE TABLE public.critiques (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_fit_score numeric,
  visual_quality_score numeric,
  safety_score numeric,
  created_at timestamp with time zone DEFAULT now(),
  critique_summary text,
  refinement_prompt text,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image'::text,
  brand_colors text NOT NULL,
  caption text NOT NULL
);

ALTER TABLE public.critiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access on critiques"
  ON public.critiques FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access on critiques"
  ON public.critiques FOR SELECT
  USING (true);

-- Generated Videos Table
CREATE TABLE public.generated_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  prompt text NOT NULL,
  brand_logo_url text,
  product_image_url text,
  video_url text,
  status text NOT NULL DEFAULT 'pending'::text
);

ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert access on generated_videos"
  ON public.generated_videos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access on generated_videos"
  ON public.generated_videos FOR SELECT
  USING (true);

CREATE POLICY "Allow public update access on generated_videos"
  ON public.generated_videos FOR UPDATE
  USING (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Trigger for generated_videos
CREATE TRIGGER update_generated_videos_updated_at
  BEFORE UPDATE ON public.generated_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();`;

  const edgeFunctions = `Edge Functions to migrate:

1. critique-with-google
   - Location: supabase/functions/critique-with-google/index.ts
   - Purpose: AI critique analysis using Google Gemini Vision
   - Required Secret: GOOGLE_API_KEY

2. generate-video-google
   - Location: supabase/functions/generate-video-google/index.ts
   - Purpose: Video generation using Google Imagen 3
   - Required Secret: GOOGLE_API_KEY

Deploy commands:
supabase functions deploy critique-with-google
supabase functions deploy generate-video-google

Set secrets:
supabase secrets set GOOGLE_API_KEY=your_google_api_key`;

  const envConfig = `# Update your .env file with your Supabase credentials:

VITE_SUPABASE_URL=${credentials.supabaseUrl || "https://your-project.supabase.co"}
VITE_SUPABASE_PUBLISHABLE_KEY=${credentials.anonKey || "your-anon-key"}
VITE_SUPABASE_PROJECT_ID=${credentials.supabaseUrl ? new URL(credentials.supabaseUrl).hostname.split('.')[0] : "your-project-id"}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Supabase Migration Setup</h1>
        <p className="text-muted-foreground">
          Complete guide to migrate from Lovable Cloud to your own Supabase instance
        </p>
      </div>

      <Alert className="mb-6">
        <Database className="h-4 w-4" />
        <AlertDescription>
          This guide will help you set up your own Supabase project and migrate all necessary data,
          schema, and edge functions from your current Lovable Cloud setup.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="credentials">1. Credentials</TabsTrigger>
          <TabsTrigger value="database">2. Database</TabsTrigger>
          <TabsTrigger value="functions">3. Functions</TabsTrigger>
          <TabsTrigger value="finalize">4. Finalize</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Supabase Credentials
              </CardTitle>
              <CardDescription>
                Create a new Supabase project at{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  supabase.com/dashboard
                </a>{" "}
                and enter your credentials below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabaseUrl">Supabase Project URL</Label>
                <Input
                  id="supabaseUrl"
                  placeholder="https://your-project.supabase.co"
                  value={credentials.supabaseUrl}
                  onChange={(e) =>
                    setCredentials({ ...credentials, supabaseUrl: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anonKey">Anon/Public Key</Label>
                <Input
                  id="anonKey"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={credentials.anonKey}
                  onChange={(e) =>
                    setCredentials({ ...credentials, anonKey: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceRoleKey">Service Role Key (for migrations)</Label>
                <Input
                  id="serviceRoleKey"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={credentials.serviceRoleKey}
                  onChange={(e) =>
                    setCredentials({ ...credentials, serviceRoleKey: e.target.value })
                  }
                />
              </div>
              <Alert>
                <AlertDescription>
                  Find these in your Supabase project: Settings → API → Project URL and Project API keys
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Schema Migration
              </CardTitle>
              <CardDescription>
                Run this SQL in your Supabase SQL Editor to create all necessary tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{databaseSchema}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(databaseSchema, "Database Schema")}
                >
                  {copied === "Database Schema" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Tables created:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• critiques - Stores AI critique analysis results</li>
                  <li>• generated_videos - Stores video generation requests and results</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Edge Functions Migration
              </CardTitle>
              <CardDescription>
                Deploy edge functions to your Supabase project using the Supabase CLI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{edgeFunctions}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(edgeFunctions, "Edge Functions")}
                >
                  {copied === "Edge Functions" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Alert>
                <AlertDescription>
                  <strong>Prerequisites:</strong> Install Supabase CLI with{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">npm install -g supabase</code>
                  <br />
                  Then run <code className="bg-muted px-1 py-0.5 rounded">supabase login</code> and{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">supabase link --project-ref your-project-id</code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finalize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Finalize Setup
              </CardTitle>
              <CardDescription>
                Update your environment variables and test the connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{envConfig}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(envConfig, "Environment Config")}
                >
                  {copied === "Environment Config" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="space-y-4 pt-4">
                <h3 className="font-semibold">Final Steps:</h3>
                <ol className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>1. Update your .env file with the credentials above</li>
                  <li>2. Update supabase/config.toml with your project_id</li>
                  <li>3. Restart your development server</li>
                  <li>4. Test the connection by running a critique or generating a video</li>
                  <li>5. Verify data is being stored in your Supabase dashboard</li>
                </ol>
              </div>
              <Alert>
                <AlertDescription>
                  <strong>Important:</strong> Make sure to set the GOOGLE_API_KEY secret in your
                  Supabase project for the edge functions to work properly.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            If you encounter any issues during migration:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Check the Supabase documentation: <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer" className="text-primary underline">supabase.com/docs</a></li>
            <li>• Verify all RLS policies are enabled</li>
            <li>• Ensure edge functions are deployed correctly</li>
            <li>• Check that all secrets are set properly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MigrationSetup;
