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

interface ActivityStats {
  total: number;
  byType: Record<string, number>;
  byCrop: Record<string, number>;
  byMonth: Record<string, number>;
}

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

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Season Summary</h2>

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

      {/* Activity Types */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Activities by Type
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-muted-foreground">{type}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-foreground w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crops */}
      {Object.keys(stats.byCrop).length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sprout className="w-5 h-5" />
            Crops Logged
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byCrop).map(([crop, count]) => (
              <div
                key={crop}
                className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
              >
                {crop} ({count})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Timeline */}
      {Object.keys(stats.byMonth).length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Activity
          </h3>
          <div className="flex items-end gap-2 h-32">
            {Object.entries(stats.byMonth).map(([month, count]) => {
              const maxCount = Math.max(...Object.values(stats.byMonth));
              const height = (count / maxCount) * 100;
              
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{count}</span>
                  <div
                    className="w-full rounded-t gradient-primary transition-all duration-500"
                    style={{ height: `${height}%`, minHeight: '8px' }}
                  />
                  <span className="text-xs text-muted-foreground">{month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
