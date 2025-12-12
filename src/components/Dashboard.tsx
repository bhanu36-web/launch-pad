import { useState } from 'react';
import {
  Mic,
  PenLine,
  MapPin,
  Calendar,
  TrendingUp,
  Cloud,
  Droplets,
  Sun,
  Leaf,
  Plus,
  ChevronRight,
  LogOut,
  User,
  Bell,
  BarChart3,
  FileText,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DashboardProps {
  onNavigate: (page: string) => void;
  farmerName: string;
  farmLocation: string;
  farmSize: string;
}

interface LogEntry {
  id: number;
  type: 'voice' | 'text' | 'observation';
  content: string;
  timestamp: string;
  location: string;
  category: string;
}

const mockLogEntries: LogEntry[] = [
  {
    id: 1,
    type: 'voice',
    content: 'Noticed early signs of leaf curl on tomato plants in the eastern plot. Applied neem oil treatment.',
    timestamp: '2 hours ago',
    location: 'Eastern Plot',
    category: 'Pest Management',
  },
  {
    id: 2,
    type: 'text',
    content: 'Completed irrigation of maize field. Soil moisture looks good after yesterday\'s rain.',
    timestamp: '5 hours ago',
    location: 'Main Field',
    category: 'Irrigation',
  },
  {
    id: 3,
    type: 'observation',
    content: 'Cassava roots showing healthy growth. Expected harvest in 3 weeks.',
    timestamp: 'Yesterday',
    location: 'Western Plot',
    category: 'Crop Health',
  },
  {
    id: 4,
    type: 'voice',
    content: 'Traditional intercropping of beans with maize showing better yields this season.',
    timestamp: '2 days ago',
    location: 'Main Field',
    category: 'Traditional Practice',
  },
];

const quickStats = [
  { label: 'Total Logs', value: '47', icon: FileText, trend: '+12 this week' },
  { label: 'Active Plots', value: '4', icon: MapPin, trend: '2 need attention' },
  { label: 'Insights Generated', value: '23', icon: BarChart3, trend: '+5 new' },
  { label: 'Days Logged', value: '34', icon: Calendar, trend: '89% consistency' },
];

const weatherData = {
  temp: '28°C',
  condition: 'Partly Cloudy',
  humidity: '65%',
  rainfall: '2mm expected',
};

export function Dashboard({ onNavigate, farmerName, farmLocation, farmSize }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'insights' | 'profile'>('overview');

  const handleNewLog = (type: 'voice' | 'text') => {
    if (type === 'voice') {
      toast.info('Voice recording started...', {
        description: 'Speak clearly to record your observation.',
      });
    } else {
      toast.info('Opening text entry...', {
        description: 'Type your farm observation.',
      });
    }
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    onNavigate('home');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AgriLog</h1>
              <p className="text-xs text-muted-foreground">Farm Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back, <span className="gradient-text">{farmerName}</span>
          </h2>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {farmLocation}
            </span>
            <span className="flex items-center gap-1">
              <Leaf className="w-4 h-4" />
              {farmSize} acres
            </span>
          </div>
        </div>

        {/* Weather Card */}
        <div className="glass rounded-2xl p-6 mb-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Today's Weather</h3>
            <span className="text-xs text-muted-foreground">Updated 30 min ago</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sun className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{weatherData.temp}</p>
                <p className="text-xs text-muted-foreground">{weatherData.condition}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{weatherData.humidity}</p>
                <p className="text-xs text-muted-foreground">Humidity</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{weatherData.rainfall}</p>
                <p className="text-xs text-muted-foreground">Rain forecast</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Good</p>
                <p className="text-xs text-muted-foreground">Farming conditions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Log Entry</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleNewLog('voice')}
              className="glass rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mic className="w-7 h-7 text-primary-foreground" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Voice Log</h4>
              <p className="text-sm text-muted-foreground">Record observations by speaking</p>
            </button>

            <button
              onClick={() => handleNewLog('text')}
              className="glass rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PenLine className="w-7 h-7 text-primary-foreground" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">Text Log</h4>
              <p className="text-sm text-muted-foreground">Type your farm observations</p>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-5 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
                <span className="text-xs text-primary font-medium">{stat.trend}</span>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Logs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Farm Logs</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-4">
            {mockLogEntries.map((entry) => (
              <div
                key={entry.id}
                className="glass rounded-2xl p-5 border border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      entry.type === 'voice'
                        ? 'bg-primary/20'
                        : entry.type === 'text'
                        ? 'bg-accent/20'
                        : 'bg-amber-500/20'
                    }`}
                  >
                    {entry.type === 'voice' ? (
                      <Mic className="w-5 h-5 text-primary" />
                    ) : entry.type === 'text' ? (
                      <PenLine className="w-5 h-5 text-accent" />
                    ) : (
                      <Leaf className="w-5 h-5 text-amber-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                        {entry.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {entry.location}
                      </span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed mb-2">{entry.content}</p>
                    <p className="text-xs text-muted-foreground">{entry.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Preview */}
        <div className="glass rounded-2xl p-6 border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Insights</h3>
              <p className="text-xs text-muted-foreground">Based on your recent logs</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-background/50 border border-border">
              <p className="text-sm text-foreground mb-2">
                <strong>🌱 Crop Pattern Detected:</strong> Your intercropping of beans with maize is showing 23% better
                yields compared to mono-cropping records in your region.
              </p>
              <p className="text-xs text-muted-foreground">
                This traditional knowledge has been verified and added to your farm profile.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-background/50 border border-border">
              <p className="text-sm text-foreground mb-2">
                <strong>⚠️ Action Recommended:</strong> Based on humidity levels and your tomato observations, consider
                preventive fungicide application within 48 hours.
              </p>
              <p className="text-xs text-muted-foreground">
                2 similar farms in your area reported early blight this week.
              </p>
            </div>
          </div>

          <Button variant="hero" size="lg" className="w-full mt-4">
            View Full Analysis
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border py-2 px-4 md:hidden">
        <div className="flex items-center justify-around">
          {[
            { icon: Leaf, label: 'Home', tab: 'overview' },
            { icon: FileText, label: 'Logs', tab: 'logs' },
            { icon: Plus, label: 'Add', tab: 'add', primary: true },
            { icon: BarChart3, label: 'Insights', tab: 'insights' },
            { icon: User, label: 'Profile', tab: 'profile' },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => {
                if (item.tab === 'add') {
                  handleNewLog('voice');
                } else {
                  setActiveTab(item.tab as any);
                }
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                item.primary
                  ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground -mt-6 shadow-lg'
                  : activeTab === item.tab
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className={item.primary ? 'w-6 h-6' : 'w-5 h-5'} />
              {!item.primary && <span className="text-xs">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer for bottom nav on mobile */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
