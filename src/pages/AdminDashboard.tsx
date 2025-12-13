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
  Users,
  Building,
  ClipboardList,
  Leaf,
  Shield,
  FileCheck,
  ScrollText,
  BarChart3,
  Settings,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';

// Import components
import { UserManagement } from '@/components/admin/UserManagement';
import { OrganizationManagement } from '@/components/admin/OrganizationManagement';
import { ExtensionWorkerManagement } from '@/components/admin/ExtensionWorkerManagement';
import { FarmerDataOversight } from '@/components/admin/FarmerDataOversight';
import { PermissionsControl } from '@/components/admin/PermissionsControl';
import { DataQualityPanel } from '@/components/admin/DataQualityPanel';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { AdminReports } from '@/components/admin/AdminReports';
import { SystemSettings } from '@/components/admin/SystemSettings';

type TabType = 'home' | 'users' | 'organizations' | 'extension-workers' | 'farmer-data' | 'permissions' | 'data-quality' | 'audit-logs' | 'reports' | 'settings';

interface AdminProfile {
  role_level: string;
  organization: string | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut, profile, role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalInstitutions: 0,
    totalExtensionWorkers: 0,
    totalActivities: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (role && role !== 'admin') {
      if (role === 'farmer') navigate('/dashboard');
      else if (role === 'enumerator') navigate('/extension-dashboard');
      else if (role === 'institution') navigate('/institution-dashboard');
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
      fetchAdminProfile();
      fetchStats();
    }
  }, [user]);

  const fetchAdminProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setAdminProfile(data as AdminProfile);
    }
  };

  const fetchStats = async () => {
    // Count users by role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role');

    const farmers = roleData?.filter(r => r.role === 'farmer').length || 0;
    const institutions = roleData?.filter(r => r.role === 'institution').length || 0;
    const extensionWorkers = roleData?.filter(r => r.role === 'enumerator').length || 0;

    // Count activities
    const { count: activitiesCount } = await supabase
      .from('farm_activities')
      .select('*', { count: 'exact', head: true });

    // Count pending access requests
    const { count: pendingCount } = await supabase
      .from('access_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    setStats({
      totalFarmers: farmers,
      totalInstitutions: institutions,
      totalExtensionWorkers: extensionWorkers,
      totalActivities: activitiesCount || 0,
      pendingApprovals: pendingCount || 0,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const tabs = [
    { id: 'users' as TabType, label: 'User Management', icon: Users },
    { id: 'organizations' as TabType, label: 'Organizations', icon: Building },
    { id: 'extension-workers' as TabType, label: 'Extension Workers', icon: ClipboardList },
    { id: 'farmer-data' as TabType, label: 'Farmer Data', icon: Leaf },
    { id: 'permissions' as TabType, label: 'Permissions', icon: Shield },
    { id: 'data-quality' as TabType, label: 'Data Quality', icon: FileCheck },
    { id: 'audit-logs' as TabType, label: 'Audit Logs', icon: ScrollText },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as TabType, label: 'System Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'organizations':
        return <OrganizationManagement />;
      case 'extension-workers':
        return <ExtensionWorkerManagement />;
      case 'farmer-data':
        return <FarmerDataOversight />;
      case 'permissions':
        return <PermissionsControl />;
      case 'data-quality':
        return <DataQualityPanel />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'reports':
        return <AdminReports />;
      case 'settings':
        return <SystemSettings />;
      default:
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.totalFarmers}</p>
                    <p className="text-xs text-muted-foreground">Farmers</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Building className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.totalInstitutions}</p>
                    <p className="text-xs text-muted-foreground">Institutions</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.totalExtensionWorkers}</p>
                    <p className="text-xs text-muted-foreground">Ext. Workers</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.totalActivities}</p>
                    <p className="text-xs text-muted-foreground">Activities</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stats.pendingApprovals}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tabs.slice(0, 6).map((tab) => (
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

            {/* System Health */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4">System Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Database: Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Auth: Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">AI Processing: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Sync: Active</span>
                </div>
              </div>
            </div>

            <p className="text-center text-muted-foreground text-sm">
              Admins manage users, permissions, and system-wide data.
            </p>
          </div>
        );
    }
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - AgriLog</title>
        <meta name="description" content="System administration panel for AgriLog platform management." />
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
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-bold text-foreground">Admin Panel</h1>
                    <p className="text-xs text-muted-foreground">
                      {adminProfile?.role_level === 'super_admin' ? 'Super Admin' : 'Administrator'} • {profile?.full_name}
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
                  Overview
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
                    <span className="hidden lg:inline">{tab.label}</span>
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
