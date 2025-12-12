interface FloatingOrbProps {
  scrollY: number;
}

export function FloatingOrbs({ scrollY }: FloatingOrbProps) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Top left orb */}
      <div
        className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/30 mix-blend-screen filter blur-3xl animate-pulse-glow"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      />
      
      {/* Top right orb */}
      <div
        className="absolute top-40 right-10 w-96 h-96 rounded-full bg-accent/25 mix-blend-screen filter blur-3xl animate-pulse-glow stagger-2"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      />
      
      {/* Bottom center orb */}
      <div
        className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full bg-secondary/30 mix-blend-screen filter blur-3xl animate-pulse-glow stagger-4"
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
      />
    </div>
  );
}
