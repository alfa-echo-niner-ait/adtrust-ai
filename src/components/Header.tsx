import { Shield } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-glow">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">BrandGuard AI</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Ad Critique & Optimization</p>
            </div>
          </NavLink>

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <NavLink 
                to="/" 
                end
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary font-semibold"
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/generate" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary font-semibold"
              >
                Generate Video
              </NavLink>
              <NavLink 
                to="/critique" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary font-semibold"
              >
                Critique Ad
              </NavLink>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
