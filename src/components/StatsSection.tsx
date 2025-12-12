interface StatsSectionProps {
  isVisible: boolean;
}

const stats = [
  { number: "95%", label: "Farmers lack digital logs" },
  { number: "100M+", label: "Smallholder farmers worldwide" },
  { number: "40%", label: "Yield loss from poor planning" },
  { number: "24/7", label: "Offline access available" },
];

export function StatsSection({ isVisible }: StatsSectionProps) {
  return (
    <div className="relative z-10 -mt-16">
      <div className="container mx-auto px-6">
        <div
          id="stats"
          data-animate
          className={`glass rounded-3xl p-8 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
          }`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="text-center transform hover:scale-110 transition-transform duration-300"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold gradient-text mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
