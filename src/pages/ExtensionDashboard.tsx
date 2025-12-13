import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Clock, 
  FileText, 
  Settings, 
  LogOut,
  Wifi,
  WifiOff,
  RefreshCw,
  Home
} from 'lucide-react';
import { FarmerList } from '@/components/extension/FarmerList';
import { AddActivityForFarmer } from '@/components/extension/AddActivityForFarmer';
import { PendingApprovals } from '@/components/extension/PendingApprovals';
import { MySubmissions } from '@/components/extension/MySubmissions';
import { ExtensionSettings } from '@/components/extension/ExtensionSettings';

type TabType = 'home' | 'farmers' | 'add-activity' | 'pending' | 'submissions' | 'settings';

interface QueuedEntry {
  id: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export default function ExtensionDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedEntries, setQueuedEntries] = useState<QueuedEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing entries...');
      syncQueuedEntries();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline — entries will sync when connected.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load queued entries from localStorage
    const saved = localStorage.getItem('extension_queued_entries');
    if (saved) {
      setQueuedEntries(JSON.parse(saved));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncQueuedEntries = async () => {
    if (queuedEntries.length === 0 || syncing) return;
    
    setSyncing(true);
    let synced = 0;

    for (const entry of queuedEntries) {
      try {
        const { error } = await supabase.from('farm_activities').insert(entry.data as any);
        if (!error) {
          synced++;
        }
      } catch (e) {
        console.error('Sync error:', e);
      }
    }

    if (synced > 0) {
      toast.success(`${synced} entries synced successfully!`);
      setQueuedEntries([]);
      localStorage.removeItem('extension_queued_entries');
    }
    setSyncing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSelectFarmer = (farmerId: string) => {
    setSelectedFarmerId(farmerId);
    setActiveTab('add-activity');
  };

  const tiles = [
    { id: 'farmers' as TabType, label: 'Farmer List / Roster', icon: Users, description: 'View and manage farmers' },
    { id: 'add-activity' as TabType, label: 'Add Activity for Farmer', icon: Plus, description: 'Record new farm activity' },
    { id: 'pending' as TabType, label: 'Pending Approvals', icon: Clock, description: 'Entries awaiting farmer review' },
    { id: 'submissions' as TabType, label: 'My Submissions', icon: FileText, description: 'All your submitted entries' },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, description: 'Account preferences' },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{profile?.full_name || 'Extension Worker'}</h1>
              <p className="text-sm text-muted-foreground">
                {profile?.village_location || 'Assigned Region'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Sync Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                isOnline ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
              }`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>
              {syncing && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Queued Entries Indicator */}
      {queuedEntries.length > 0 && (
        <div className="bg-orange-500/20 border-b border-orange-500/30 px-4 py-2">
          <p className="text-center text-sm text-orange-300">
            {queuedEntries.length} entries pending sync
            {isOnline && (
              <button 
                onClick={syncQueuedEntries}
                className="ml-2 underline hover:text-orange-200"
              >
                Sync now
              </button>
            )}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-foreground mb-6">Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => setActiveTab(tile.id)}
                  className="glass rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:glow-primary group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                      <tile.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {tile.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">{tile.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'farmers' && (
          <FarmerList 
            onBack={() => setActiveTab('home')} 
            onSelectFarmer={handleSelectFarmer}
          />
        )}

        {activeTab === 'add-activity' && (
          <AddActivityForFarmer 
            onBack={() => {
              setSelectedFarmerId(null);
              setActiveTab('home');
            }}
            selectedFarmerId={selectedFarmerId}
            isOnline={isOnline}
            onQueueEntry={(entry) => {
              const newQueue = [...queuedEntries, entry];
              setQueuedEntries(newQueue);
              localStorage.setItem('extension_queued_entries', JSON.stringify(newQueue));
            }}
          />
        )}

        {activeTab === 'pending' && (
          <PendingApprovals onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'submissions' && (
          <MySubmissions onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'settings' && (
          <ExtensionSettings onBack={() => setActiveTab('home')} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 safe-area-bottom">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            {[
              { id: 'home' as TabType, icon: Home, label: 'Home' },
              { id: 'farmers' as TabType, icon: Users, label: 'Farmers' },
              { id: 'add-activity' as TabType, icon: Plus, label: 'Add' },
              { id: 'submissions' as TabType, icon: FileText, label: 'My Work' },
              { id: 'settings' as TabType, icon: Settings, label: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
