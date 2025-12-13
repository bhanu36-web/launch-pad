import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Droplets,
  Download
} from 'lucide-react';

export function InstitutionReports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cropData, setCropData] = useState<{ name: string; value: number }[]>([]);
  const [activityData, setActivityData] = useState<{ name: string; count: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; activities: number }[]>([]);
  const [regionData, setRegionData] = useState<{ name: string; farmers: number }[]>([]);

  const COLORS = ['hsl(142, 71%, 45%)', 'hsl(142, 71%, 35%)', 'hsl(142, 71%, 55%)', 'hsl(142, 71%, 65%)', 'hsl(142, 71%, 25%)'];

  useEffect(() => {
    if (user) fetchReportData();
  }, [user]);

  const fetchReportData = async () => {
    if (!user) return;

    try {
      // Get approved farmers
      const { data: requests } = await supabase
        .from('access_requests')
        .select('farmer_id')
        .eq('institution_id', user.id)
        .eq('status', 'approved');

      if (!requests || requests.length === 0) {
        setLoading(false);
        return;
      }

      const farmerIds = requests.map(r => r.farmer_id);

      // Get activities for approved farmers
      const { data: activities } = await supabase
        .from('farm_activities')
        .select('*')
        .in('user_id', farmerIds);

      if (activities) {
        // Crop distribution
        const cropCounts: Record<string, number> = {};
        activities.forEach(a => {
          const crop = a.crop || 'Unknown';
          cropCounts[crop] = (cropCounts[crop] || 0) + 1;
        });
        setCropData(Object.entries(cropCounts).map(([name, value]) => ({ name, value })));

        // Activity type distribution
        const activityCounts: Record<string, number> = {};
        activities.forEach(a => {
          activityCounts[a.activity_type] = (activityCounts[a.activity_type] || 0) + 1;
        });
        setActivityData(Object.entries(activityCounts).map(([name, count]) => ({ name, count })));

        // Monthly trend
        const monthCounts: Record<string, number> = {};
        activities.forEach(a => {
          const month = new Date(a.activity_date).toLocaleString('default', { month: 'short' });
          monthCounts[month] = (monthCounts[month] || 0) + 1;
        });
        setMonthlyData(Object.entries(monthCounts).map(([month, activities]) => ({ month, activities })));
      }

      // Get region data from profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('village_location')
        .in('user_id', farmerIds);

      if (profiles) {
        const regionCounts: Record<string, number> = {};
        profiles.forEach(p => {
          const region = p.village_location || 'Unknown';
          regionCounts[region] = (regionCounts[region] || 0) + 1;
        });
        setRegionData(Object.entries(regionCounts).slice(0, 5).map(([name, farmers]) => ({ name, farmers })));
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Reports & Analytics</h2>
          <p className="text-muted-foreground">Insights from farmers who have shared their data</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{cropData.reduce((sum, c) => sum + c.value, 0)}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{cropData.length}</p>
              <p className="text-xs text-muted-foreground">Crop Types</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {activityData.find(a => a.name === 'pest_control')?.count || 0}
              </p>
              <p className="text-xs text-muted-foreground">Pest Reports</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{regionData.length}</p>
              <p className="text-xs text-muted-foreground">Regions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crop Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Crop Distribution</h3>
          {cropData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={cropData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {cropData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* Activity Types */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Activity Types</h3>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Activity Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey="activities" stroke="hsl(142, 71%, 45%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* Regional Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Regional Distribution</h3>
          {regionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={regionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="farmers" fill="hsl(142, 71%, 35%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
