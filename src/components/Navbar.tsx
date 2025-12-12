import { Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onNavigate: (page: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  return (
    <nav className="container mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-3 group"
        >
          <div className="gradient-primary p-2.5 rounded-xl transform group-hover:rotate-12 transition-transform duration-300 glow-accent">
            <Sprout className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold gradient-text">
            AgriLog
          </span>
        </button>
        <Button 
          variant="hero" 
          size="default"
          onClick={() => onNavigate('get-started')}
        >
          Get Started
        </Button>
      </div>
    </nav>
  );
}
