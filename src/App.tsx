import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import Dashboard from "./pages/Dashboard";
import GenerateVideo from "./pages/GenerateVideo";
import CritiqueAnalysis from "./pages/CritiqueAnalysis";
import CritiqueResults from "./pages/CritiqueResults";
import MigrationSetup from "./pages/MigrationSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/generate" element={<GenerateVideo />} />
              <Route path="/critique" element={<CritiqueAnalysis />} />
              <Route path="/results/:id" element={<CritiqueResults />} />
              <Route path="/migration-setup" element={<MigrationSetup />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
