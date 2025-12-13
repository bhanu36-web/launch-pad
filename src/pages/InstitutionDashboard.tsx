import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FloatingOrbs } from '@/components/FloatingOrbs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  LogOut, 
  Search,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  Download,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Building
} from 'lucide-react';

// Import components
import { FindFarmers } from '@/components/institution/FindFarmers';
import { FarmProfiles } from '@/components/institution/FarmProfiles';
import { InstitutionReports } from '@/components/institution/InstitutionReports';
import { PendingRequests } from '@/components/institution/PendingRequests';
import { ApprovedFarmers } from '@/components/institution/ApprovedFarmers';
import { DownloadData } from '@/components/institution/DownloadData';
import { InstitutionSettings } from '@/components/institution/InstitutionSettings';

type TabType = 'home' | 'find-farmers' | 'farm-profiles' | 'reports' | 'pending-requests' | 'approved-farmers' | 'download' | 'settings';

interface InstitutionProfile {
  organization_name: string;
  institution_type: string;
  representative_name: string;
  country_region: string | null;
}

export default function InstitutionDashboard() {
  const navigate = useNavigate();
  const { user, signOut, role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfile | null>(null);
  const [stats, setStats] = useState({
    approvedFarmers: 0,
    verifiedRecords: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (role && role !== 'institution') {
      if (role === 'farmer') navigate('/dashboard');
      else if (role === 'enumerator') navigate('/extension-dashboard');
      else if (role === 'admin') navigate('/admin-dashboard');
    }
  }, [user, role, navigate]);

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
      fetchInstitutionProfile();
      fetchStats();
    }
  }, [user]);

  const fetchInstitutionProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('institution_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setInstitutionProfile(data as InstitutionProfile);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    
    // Count approved farmers
    const { count: approvedCount } = await supabase
      .from('access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', user.id)
      .eq('status', 'approved');

    // Count pending requests
    const { count: pendingCount } = await supabase
      .from('access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', user.id)
      .eq('status', 'pending');

    setStats({
      approvedFarmers: approvedCount || 0,
      verifiedRecords: 0, // Will be calculated when accessing farmer data
      pendingRequests: pendingCount || 0,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const tabs = [
    { id: 'find-farmers' as TabType, label: 'Find Farmers', icon: Search },
    { id: 'farm-profiles' as TabType, label: 'Farm Profiles', icon: Users },
    { id: 'reports' as TabType, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'pending-requests' as TabType, label: 'Pending Requests', icon: Clock },
    { id: 'approved-farmers' as TabType, label: 'My Approved Farmers', icon: CheckCircle },
    { id: 'download' as TabType, label: 'Download Data', icon: Download },
    { id: 'settings' as TabType, label: 'Organization Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'find-farmers':
        return <FindFarmers />;
      case 'farm-profiles':
        return <FarmProfiles />;
      case 'reports':
        return <InstitutionReports />;
      case 'pending-requests':
        return <PendingRequests onRefresh={fetchStats} />;
      case 'approved-farmers':
        return <ApprovedFarmers />;
      case 'download':
        return <DownloadData />;
      case 'settings':
        return <InstitutionSettings />;
      default:
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.approvedFarmers}</p>
                    <p className="text-sm text-muted-foreground">Farmers Sharing Data</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.verifiedRecords}</p>
                    <p className="text-sm text-muted-foreground">Verified Records</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingRequests}</p>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tabs.slice(0, 4).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="glass rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:glow-primary group"
                >
                  <div className="w-14 h-14 mx-auto rounded-xl gradient-primary flex items-center justify-center mb-3">
                    <tab.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {tab.label}
                  </h3>
                </button>
              ))}
            </div>

            {/* Data Freshness */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Data Freshness</span>
                </div>
                <span className="text-muted-foreground text-sm">Last update: Just now</span>
              </div>
            </div>

            {/* Microcopy */}
            <p className="text-center text-muted-foreground text-sm">
              Access farmer data only with permission. All data is verified and traceable.
            </p>
          </div>
        );
    }
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Institution Dashboard - AgriLog</title>
        <meta name="description" content="Access and analyze verified farmer data with institutional controls." />
      </Helmet>

      <div className="min-h-screen gradient-hero">
        <FloatingOrbs scrollY={0} />

        <div className="relative z-10">
          {/* Header */}
          <header className="glass border-b border-border/50 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-bold text-foreground">
                      {institutionProfile?.organization_name || 'Institution'}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      {institutionProfile?.representative_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    {isOnline ? (
                      <>
                        <Wifi className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground hidden sm:inline">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-destructive" />
                        <span className="text-muted-foreground hidden sm:inline">Offline</span>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Navigation Tabs */}
          <div className="glass border-b border-border/50 overflow-x-auto">
            <div className="container mx-auto px-4">
              <div className="flex gap-1 py-2">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === 'home'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  Dashboard
                </button>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </>
  );
}
