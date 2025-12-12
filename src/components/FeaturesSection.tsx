import { Database, Cloud, Users, Smartphone, TrendingUp, Shield, LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: Database,
    title: "Structured Farm Records",
    desc: "Time-stamped, geo-tagged logging of crop histories, soil tests, and pest events",
    gradient: "from-primary to-accent",
  },
  {
    icon: Cloud,
    title: "Offline-First Design",
    desc: "Works without internet, syncs when connected - perfect for rural areas",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    icon: Users,
    title: "Knowledge Preservation",
    desc: "Capture and preserve elder farming wisdom and community practices",
    gradient: "from-violet-400 to-pink-500",
  },
  {
    icon: Smartphone,
    title: "Multi-Language Support",
    desc: "Voice, text, and short-form entries in local languages",
    gradient: "from-orange-400 to-red-500",
  },
  {
    icon: TrendingUp,
    title: "AI Decision Support",
    desc: "Actionable insights tailored to your farm for better productivity",
    gradient: "from-teal-400 to-primary",
  },
  {
    icon: Shield,
    title: "Data Ownership",
    desc: "You control your data with full privacy and security",
    gradient: "from-indigo-400 to-violet-500",
  },
];

interface FeaturesSectionProps {
  isVisible: Record<string, boolean>;
}

export function FeaturesSection({ isVisible }: FeaturesSectionProps) {
  return (
    <div className="relative z-10 py-24 bg-card/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Powerful Features</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Everything you need to manage your farm effectively
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              id={`feature-${idx}`}
              data-animate
              className={`glass rounded-2xl p-8 hover:border-primary/30 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 group ${
                isVisible[`feature-${idx}`] ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
              }`}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <div
                className={`bg-gradient-to-br ${feature.gradient} w-14 h-14 rounded-xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-300 shadow-lg`}
              >
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
