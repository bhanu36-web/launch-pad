import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LearnMorePageProps {
  onNavigate: (page: string) => void;
}

const steps = [
  {
    number: "1",
    title: "Record Your Farm Activities",
    description:
      "Use voice, text, or quick forms to log daily activities, crop planting, pest observations, soil conditions, and weather patterns. Everything is automatically time-stamped and geo-tagged. Works completely offline with automatic sync when connected.",
    gradient: "from-primary to-accent",
  },
  {
    number: "2",
    title: "AI Analyzes Your Data",
    description:
      "Our AI engine processes your farm data along with weather patterns, soil health indicators, and historical yields. It learns from your farming practices and compares them with successful patterns from similar farms in your region.",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    number: "3",
    title: "Get Actionable Insights",
    description:
      "Receive personalized recommendations for optimal planting times, pest management strategies, irrigation schedules, and fertilizer application. Get alerts for potential issues before they become problems.",
    gradient: "from-violet-400 to-pink-500",
  },
  {
    number: "4",
    title: "Access Benefits & Markets",
    description:
      "Use your verified farm records to access government subsidies, crop insurance, bank loans, and premium markets. Share selective data with buyers to get better prices.",
    gradient: "from-orange-400 to-red-500",
  },
];

export function LearnMorePage({ onNavigate }: LearnMorePageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground py-20">
      <div className="container mx-auto px-6">
        <button
          onClick={() => onNavigate('home')}
          className="mb-8 text-primary hover:text-primary/80 flex items-center gap-2 transition-colors duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center gradient-text animate-fade-in-up">
            How AgriLog Works
          </h1>

          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="glass rounded-3xl p-8 transform hover:scale-[1.02] transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="flex items-start gap-6">
                  <div
                    className={`bg-gradient-to-br ${step.gradient} w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                  >
                    <span className="text-xl md:text-2xl font-bold text-primary-foreground">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center animate-fade-in-up stagger-5">
            <Button
              variant="hero"
              size="xl"
              onClick={() => onNavigate('get-started')}
              className="hover:scale-110"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
