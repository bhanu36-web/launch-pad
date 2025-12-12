import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  scrollY: number;
  onNavigate: (page: string) => void;
}

export function HeroSection({ scrollY, onNavigate }: HeroSectionProps) {
  return (
    <div className="container mx-auto px-6 pt-16 pb-32">
      <div
        className="text-center max-w-4xl mx-auto transform transition-all duration-1000"
        style={{
          opacity: scrollY < 100 ? 1 : Math.max(0.6, 1 - scrollY / 500),
          transform: `translateY(${Math.min(scrollY * 0.3, 100)}px)`,
        }}
      >
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight animate-fade-in-up">
          <span className="gradient-text animate-pulse">
            Empowering Farmers
          </span>
          <br />
          <span className="text-foreground">Through AI & Data</span>
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 leading-relaxed animate-fade-in-up stagger-2 text-balance max-w-3xl mx-auto">
          The AI-powered, offline-first Farm Log Agent that transforms
          how smallholder farmers record, preserve, and utilize agricultural knowledge
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up stagger-3">
          <Button
            variant="hero"
            size="xl"
            onClick={() => window.location.href = '/auth'}
            className="group"
          >
            <Smartphone className="w-5 h-5 group-hover:animate-bounce" />
            Sign Up
          </Button>
          <Button
            variant="outline"
            size="xl"
            onClick={() => window.location.href = '/auth'}
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}
