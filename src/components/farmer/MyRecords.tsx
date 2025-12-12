import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Leaf,
  Sprout,
  Droplets,
  Bug,
  Wheat,
  MapPin,
  Calendar,
  CloudOff,
  Download,
  ChevronRight,
} from 'lucide-react';

interface FarmActivity {
  id: string;
  activity_type: string;
  crop: string | null;
  activity_date: string;
  notes: string | null;
  inputs_used: string | null;
  ai_summary: string | null;
  ai_extracted_data: any;
  location_lat: number | null;
  location_lng: number | null;
  sync_status: string;
}

const activityIcons: Record<string, any> = {
  Planting: Sprout,
  Fertilizer: Droplets,
  Pest: Bug,
  Irrigation: Droplets,
  Harvest: Wheat,
  Other: Leaf,
};

export function MyRecords() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<FarmActivity | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('farm_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('activity_date', { ascending: false });

    if (!error && data) {
      setActivities(data as FarmActivity[]);
    }
    setLoading(false);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.activity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.crop?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (activity.notes?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCrop = !filterCrop || activity.crop === filterCrop;
    
    return matchesSearch && matchesCrop;
  });

  const uniqueCrops = [...new Set(activities.map(a => a.crop).filter(Boolean))];

  if (selectedActivity) {
    const Icon = activityIcons[selectedActivity.activity_type] || Leaf;
    
    return (
      <div className="animate-fade-in-up space-y-4">
        <Button variant="ghost" onClick={() => setSelectedActivity(null)} className="mb-2">
          ← Back to Records
        </Button>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
              <Icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{selectedActivity.activity_type}</h2>
              <p className="text-muted-foreground">{selectedActivity.crop}</p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(selectedActivity.activity_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</span>
            </div>

            {selectedActivity.location_lat && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Lat: {selectedActivity.location_lat.toFixed(4)}, Lng: {selectedActivity.location_lng?.toFixed(4)}</span>
              </div>
            )}
          </div>

          {selectedActivity.ai_summary && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <h4 className="font-medium text-primary mb-2">AI Summary</h4>
              <p className="text-sm text-foreground">{selectedActivity.ai_summary}</p>
            </div>
          )}

          {selectedActivity.notes && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground">{selectedActivity.notes}</p>
            </div>
          )}

          {selectedActivity.inputs_used && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Inputs Used</h4>
              <p className="text-sm text-muted-foreground">{selectedActivity.inputs_used}</p>
            </div>
          )}

          {selectedActivity.ai_extracted_data && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Extracted Data</h4>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <pre className="whitespace-pre-wrap text-muted-foreground">
                  {JSON.stringify(selectedActivity.ai_extracted_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full gap-2">
            <Download className="w-4 h-4" />
            Download Document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      <h2 className="text-xl font-semibold text-foreground">My Records</h2>
      
      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="pl-9"
          />
        </div>
        <select
          value={filterCrop}
          onChange={(e) => setFilterCrop(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Crops</option>
          {uniqueCrops.map(crop => (
            <option key={crop} value={crop!}>{crop}</option>
          ))}
        </select>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filteredActivities.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No activities found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const Icon = activityIcons[activity.activity_type] || Leaf;
            
            return (
              <button
                key={activity.id}
                onClick={() => setSelectedActivity(activity)}
                className="w-full glass rounded-xl p-4 flex items-center gap-4 text-left transition-all duration-300 hover:scale-[1.01] hover:glow-primary"
              >
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{activity.activity_type}</p>
                    {activity.sync_status === 'pending' && (
                      <CloudOff className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.crop && `${activity.crop} • `}
                    {new Date(activity.activity_date).toLocaleDateString()}
                  </p>
                  {activity.ai_summary && (
                    <p className="text-xs text-muted-foreground truncate mt-1">{activity.ai_summary}</p>
                  )}
                </div>

                {activity.location_lat && (
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                )}
                
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
