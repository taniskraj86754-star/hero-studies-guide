import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <nav className="container flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display">Homework Hero</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-smooth">Features</a>
          <a href="#subjects" className="hover:text-foreground transition-smooth">Subjects</a>
          <a href="#tools" className="hover:text-foreground transition-smooth">Study Tools</a>
          <a href="#pricing" className="hover:text-foreground transition-smooth">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <a href="/auth">Sign in</a>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <a href="/auth">Get Started</a>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
