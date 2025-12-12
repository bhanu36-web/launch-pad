import { Sprout } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 py-12 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="gradient-primary p-2 rounded-lg">
              <Sprout className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text">AgriLog</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} AgriLog. Empowering farmers worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
