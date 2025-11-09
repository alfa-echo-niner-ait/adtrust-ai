import { Shield, Video, Image, FileText, LayoutDashboard, Workflow, ClipboardList } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

export const Header = () => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <NavLink to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-accent to-primary/60 flex items-center justify-center shadow-glow">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-background animate-pulse"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gradient">
                AdTrust
              </h1>
              <p className="text-xs text-muted-foreground">
                AI-Powered Ad Quality Control
              </p>
            </div>
          </NavLink>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink 
              to="/" 
              end
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeClassName="text-foreground bg-accent"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink 
              to="/generate" 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeClassName="text-foreground bg-accent"
            >
              <Video className="h-4 w-4" />
              Video
            </NavLink>
            <NavLink 
              to="/generate-poster" 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeClassName="text-foreground bg-accent"
            >
              <Image className="h-4 w-4" />
              Poster
            </NavLink>
            <NavLink 
              to="/critique" 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeClassName="text-foreground bg-accent"
            >
              <FileText className="h-4 w-4" />
              Critique
            </NavLink>
            <NavLink 
              to="/auto-workflow" 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeClassName="text-foreground bg-accent"
            >
              <Workflow className="h-4 w-4" />
              Workflow
            </NavLink>
            <NavLink 
              to="/review-queue" 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeClassName="text-foreground bg-accent"
            >
              <ClipboardList className="h-4 w-4" />
              Review
            </NavLink>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="default"
              className="hidden md:inline-flex gradient-primary text-primary-foreground shadow-glow"
              onClick={() => window.location.href = '/auto-workflow'}
            >
              <Workflow className="h-4 w-4 mr-2" />
              Auto Workflow
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
