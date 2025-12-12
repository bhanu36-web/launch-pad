interface ImpactSectionProps {
  isVisible: boolean;
}

const impacts = [
  {
    title: "Improved Productivity",
    desc: "Make informed decisions with structured data and AI insights",
  },
  {
    title: "Access to Markets",
    desc: "Qualify for insurance, subsidies, and better market opportunities",
  },
  {
    title: "Knowledge Preservation",
    desc: "Capture and pass on traditional farming wisdom to future generations",
  },
  {
    title: "Better Planning",
    desc: "Prevent nutrient depletion and optimize crop rotation",
  },
];

export function ImpactSection({ isVisible }: ImpactSectionProps) {
  return (
    <div className="relative z-10 py-24">
      <div className="container mx-auto px-6">
        <div
          id="impact"
          data-animate
          className={`max-w-5xl mx-auto glass rounded-3xl p-8 md:p-12 border-primary/20 transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
          }`}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">The AgriLog Impact</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Transforming agriculture, one farm at a time
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {impacts.map((impact, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 bg-card/50 rounded-xl hover:bg-card transition-colors duration-300"
              >
                <div className="bg-primary rounded-full p-1.5 mt-1 flex-shrink-0">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1 text-foreground">{impact.title}</h4>
                  <p className="text-muted-foreground">{impact.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
