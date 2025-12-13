import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Plus,
  FileText,
  BarChart3,
  Share2,
  Settings,
  LogOut,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Home,
  User,
  Leaf,
  Menu,
} from 'lucide-react';
import { AddActivityFlow } from '@/components/farmer/AddActivityFlow';
import { MyRecords } from '@/components/farmer/MyRecords';
import { SeasonSummary } from '@/components/farmer/SeasonSummary';
import { SharePermissions } from '@/components/farmer/SharePermissions';
import { FarmerSettings } from '@/components/farmer/FarmerSettings';

type TabType = 'home' | 'records' | 'summary' | 'share' | 'settings';

interface FarmActivity {
  id: string;
  activity_type: string;
  crop: string | null;
  activity_date: string;
  notes: string | null;
  ai_summary: string | null;
  sync_status: string;
}

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('farm_activities')
      .select('*')
      .eq('user_id', user?.id)
      .order('activity_date', { ascending: false })
      .limit(10);

    if (!error && data) {
      setActivities(data as FarmActivity[]);
      setPendingSync(data.filter(a => a.sync_status === 'pending').length);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleActivitySaved = () => {
    setShowAddActivity(false);
    fetchActivities();
    toast.success('Activity saved!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (showAddActivity) {
    return <AddActivityFlow onClose={() => setShowAddActivity(false)} onSave={handleActivitySaved} />;
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - AgriLog | Your Farm at a Glance</title>
        <meta name="description" content="Manage your farm activities, view records, and get AI-powered insights." />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">{profile?.full_name || 'Farmer'}</h1>
                <p className="text-xs text-muted-foreground">{profile?.village_location || 'Your Farm'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Online/Offline Status */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isOnline ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>

              {/* Sync Status */}
              {pendingSync > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs">
                  <CloudOff className="w-3 h-3" />
                  {pendingSync} queued
                </div>
              )}

              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Welcome Card */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'Farmer'}!
                </h2>
                <p className="text-muted-foreground text-sm">
                  What would you like to do today?
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowAddActivity(true)}
                  className="glass rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:glow-primary group"
                >
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary">Add New Activity</h3>
                  <p className="text-xs text-muted-foreground mt-1">Log your farm work</p>
                </button>

                <button
                  onClick={() => setActiveTab('records')}
                  className="glass rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:glow-accent group"
                >
                  <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-secondary">My Records</h3>
                  <p className="text-xs text-muted-foreground mt-1">{activities.length} activities</p>
                </button>

                <button
                  onClick={() => setActiveTab('summary')}
                  className="glass rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:glow-accent group"
                >
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-accent">Season Summary</h3>
                  <p className="text-xs text-muted-foreground mt-1">View analytics</p>
                </button>

                <button
                  onClick={() => setActiveTab('share')}
                  className="glass rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:glow-primary group"
                >
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Share2 className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary">Share / Permissions</h3>
                  <p className="text-xs text-muted-foreground mt-1">Control access</p>
                </button>
              </div>

              {/* Recent Activities */}
              {activities.length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Recent Activities</h3>
                    <button
                      onClick={() => setActiveTab('records')}
                      className="text-sm text-primary hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {activities.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{activity.activity_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.crop && `${activity.crop} • `}
                            {new Date(activity.activity_date).toLocaleDateString()}
                          </p>
                        </div>
                        {activity.sync_status === 'pending' && (
                          <CloudOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'records' && <MyRecords />}
          {activeTab === 'summary' && <SeasonSummary />}
          {activeTab === 'share' && <SharePermissions />}
          {activeTab === 'settings' && <FarmerSettings />}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-around py-2">
              {[
                { id: 'home' as TabType, icon: Home, label: 'Home' },
                { id: 'records' as TabType, icon: FileText, label: 'Records' },
                { id: 'summary' as TabType, icon: BarChart3, label: 'Summary' },
                { id: 'share' as TabType, icon: Share2, label: 'Share' },
                { id: 'settings' as TabType, icon: Settings, label: 'Settings' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                    activeTab === item.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
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
    </>
  );
}
