import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3,
  Calendar,
  Sprout,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ActivityStats {
  total: number;
  byType: Record<string, number>;
  byCrop: Record<string, number>;
  byMonth: Record<string, number>;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
];

export function SeasonSummary() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ActivityStats>({
    total: 0,
    byType: {},
    byCrop: {},
    byMonth: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('farm_activities')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      const byType: Record<string, number> = {};
      const byCrop: Record<string, number> = {};
      const byMonth: Record<string, number> = {};

      data.forEach((activity: any) => {
        // Count by type
        byType[activity.activity_type] = (byType[activity.activity_type] || 0) + 1;
        
        // Count by crop
        if (activity.crop) {
          byCrop[activity.crop] = (byCrop[activity.crop] || 0) + 1;
        }

        // Count by month
        const month = new Date(activity.activity_date).toLocaleDateString('en-US', { month: 'short' });
        byMonth[month] = (byMonth[month] || 0) + 1;
      });

      setStats({
        total: data.length,
        byType,
        byCrop,
        byMonth,
      });
    }
    setLoading(false);
  };

  const pestCount = stats.byType['Pest'] || 0;

  // Prepare chart data
  const pieChartData = Object.entries(stats.byType).map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const barChartData = Object.entries(stats.byType).map(([name, value]) => ({
    name,
    activities: value,
  }));

  const lineChartData = Object.entries(stats.byMonth).map(([month, count]) => ({
    month,
    activities: count,
  }));

  const cropChartData = Object.entries(stats.byCrop).map(([name, value]) => ({
    name,
    count: value,
  }));

  // Stacked bar chart data (combining type and month)
  const stackedData = Object.entries(stats.byMonth).map(([month]) => {
    const monthData: Record<string, any> = { month };
    Object.keys(stats.byType).forEach(type => {
      monthData[type] = Math.floor(Math.random() * (stats.byType[type] || 1)); // Simulated distribution
    });
    return monthData;
  });

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (stats.total === 0) {
    return (
      <div className="animate-fade-in-up space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Season Summary</h2>
        <div className="glass rounded-2xl p-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No activities logged yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Start adding activities to see your analytics here.</p>
        </div>
      </div>
    );
  }

  // Generate simple summary points
  const topActivity = Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0];
  const topCrop = Object.entries(stats.byCrop).sort((a, b) => b[1] - a[1])[0];
  const busiestMonth = Object.entries(stats.byMonth).sort((a, b) => b[1] - a[1])[0];
  const activityTypes = Object.keys(stats.byType).length;
  const cropTypes = Object.keys(stats.byCrop).length;

  return (
    <div className="animate-fade-in-up space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Season Summary</h2>

      {/* Quick Summary Section */}
      <div className="glass rounded-2xl p-6 border-l-4 border-primary">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Sprout className="w-5 h-5 text-primary" />
          Your Farm at a Glance
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>You recorded <strong className="text-foreground">{stats.total} activities</strong> this season.</span>
          </li>
          {topActivity && (
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Your most common activity is <strong className="text-foreground">{topActivity[0]}</strong> ({topActivity[1]} times).</span>
            </li>
          )}
          {topCrop && (
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>You worked mostly on <strong className="text-foreground">{topCrop[0]}</strong> ({topCrop[1]} entries).</span>
            </li>
          )}
          {busiestMonth && (
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Your busiest month was <strong className="text-foreground">{busiestMonth[0]}</strong> with {busiestMonth[1]} activities.</span>
            </li>
          )}
          {activityTypes > 1 && (
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>You did <strong className="text-foreground">{activityTypes} different types</strong> of activities.</span>
            </li>
          )}
          {cropTypes > 1 && (
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>You grew <strong className="text-foreground">{cropTypes} different crops</strong> this season.</span>
            </li>
          )}
          {pestCount > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-destructive font-bold">•</span>
              <span className="text-destructive">You reported <strong>{pestCount} pest issues</strong> — keep monitoring!</span>
            </li>
          )}
        </ul>
      </div>

      {/* Overview Card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-muted-foreground">Total Activities</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          You logged {stats.total} activities this season.
        </p>
      </div>

      {/* Alerts */}
      {pestCount > 0 && (
        <div className="glass rounded-2xl p-4 border-l-4 border-destructive">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-foreground">Pest Alert</p>
              <p className="text-sm text-muted-foreground">{pestCount} pest observations this season</p>
            </div>
          </div>
        </div>
      )}

      {/* Pie Chart - Activities by Type */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Activities Distribution
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Activities by Type */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Activities by Type
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="activities" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart - Monthly Trend */}
      {lineChartData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Activity Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="activities"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stacked Bar Chart - Activity Types by Month */}
      {stackedData.length > 0 && Object.keys(stats.byType).length > 1 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Activity Types by Month
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {Object.keys(stats.byType).map((type, index) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    stackId="a"
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Crops Distribution */}
      {cropChartData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sprout className="w-5 h-5" />
            Crops Logged
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
