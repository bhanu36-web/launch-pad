interface ProblemSectionProps {
  isVisible: boolean;
}

export function ProblemSection({ isVisible }: ProblemSectionProps) {
  return (
    <div className="relative z-10 py-24">
      <div className="container mx-auto px-6">
        <div
          id="problem"
          data-animate
          className={`max-w-4xl mx-auto text-center transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            The <span className="gradient-danger">Challenge</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-balance">
            95% of smallholder farmers operate without structured farm records.
            Crop histories, soil tests, pest events, and extension advice remain unrecorded or siloed,
            leading to poor planning, nutrient depletion, unpredictable yields, and the gradual loss of
            invaluable local agronomic knowledge.
          </p>
        </div>
      </div>
    </div>
  );
}
