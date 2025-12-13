import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  MapPin, 
  Calendar,
  FileText,
  Download,
  ChevronRight,
  Search,
  Leaf,
  CheckCircle,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';

interface ApprovedFarmer {
  id: string;
  farmerId: string;
  farmerName: string;
  village: string | null;
  expiresAt: string | null;
  activities: FarmActivity[];
}

interface FarmActivity {
  id: string;
  activity_type: string;
  crop: string | null;
  activity_date: string;
  ai_summary: string | null;
  notes: string | null;
}

export function FarmProfiles() {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<ApprovedFarmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<ApprovedFarmer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchApprovedFarmers();
  }, [user]);

  const fetchApprovedFarmers = async () => {
    if (!user) return;

    try {
      // Get approved access requests
      const { data: requests } = await supabase
        .from('access_requests')
        .select('farmer_id, expires_at')
        .eq('institution_id', user.id)
        .eq('status', 'approved');

      if (!requests || requests.length === 0) {
        setFarmers([]);
        setLoading(false);
        return;
      }

      const farmerIds = requests.map(r => r.farmer_id);

      // Get farmer profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, village_location')
        .in('user_id', farmerIds);

      // Get activities for each farmer
      const { data: activities } = await supabase
        .from('farm_activities')
        .select('*')
        .in('user_id', farmerIds)
        .order('activity_date', { ascending: false });

      const formattedFarmers: ApprovedFarmer[] = requests.map(request => {
        const profile = profiles?.find(p => p.user_id === request.farmer_id);
        const farmerActivities = activities?.filter(a => a.user_id === request.farmer_id) || [];
        
        return {
          id: request.farmer_id,
          farmerId: request.farmer_id,
          farmerName: profile?.full_name || 'Unknown',
          village: profile?.village_location,
          expiresAt: request.expires_at,
          activities: farmerActivities as FarmActivity[],
        };
      });

      setFarmers(formattedFarmers);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFarmers = farmers.filter(f =>
    f.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.village?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVerificationIcon = (activity: FarmActivity) => {
    // Check if activity was collected by extension worker
    const aiData = activity.ai_summary ? JSON.parse(activity.ai_summary || '{}') : {};
    if (aiData.collectedBy === 'extension_worker') {
      return <ClipboardList className="w-4 h-4 text-primary" />;
    }
    return <User className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (selectedFarmer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedFarmer(null)}>
          ← Back to Farmers
        </Button>

        {/* Farmer Overview */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{selectedFarmer.farmerName}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {selectedFarmer.village || 'Location not specified'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-foreground">{selectedFarmer.activities.length}</p>
              <p className="text-sm text-muted-foreground">Total Activities</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-foreground">
                {new Set(selectedFarmer.activities.map(a => a.crop).filter(Boolean)).size}
              </p>
              <p className="text-sm text-muted-foreground">Crops</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-2xl font-bold text-foreground">
                {selectedFarmer.activities.filter(a => a.ai_summary).length}
              </p>
              <p className="text-sm text-muted-foreground">AI Processed</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground">
                {selectedFarmer.expiresAt 
                  ? format(new Date(selectedFarmer.expiresAt), 'MMM d, yyyy')
                  : 'No expiry'
                }
              </p>
              <p className="text-sm text-muted-foreground">Access Expires</p>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Activity Timeline</h3>
          <div className="space-y-4">
            {selectedFarmer.activities.map((activity) => (
              <div key={activity.id} className="border-l-2 border-primary/30 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground capitalize">{activity.activity_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.crop || 'No crop specified'} • {format(new Date(activity.activity_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getVerificationIcon(activity)}
                    {activity.ai_summary && (
                      <CheckCircle className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </div>
                {activity.ai_summary && (
                  <div className="mt-2 ml-13 bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">{activity.ai_summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Download Options */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Download Options</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Full PDF Profile
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSV Dataset
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Evidence Bundle
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Farm Profiles</h2>
        <p className="text-muted-foreground">View detailed profiles of farmers who have granted you access</p>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search farmers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Farmers List */}
      {filteredFarmers.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Approved Farmers</h3>
          <p className="text-muted-foreground">Request access from farmers to view their profiles.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFarmers.map((farmer) => (
            <button
              key={farmer.id}
              onClick={() => setSelectedFarmer(farmer)}
              className="w-full glass rounded-2xl p-6 text-left transition-all hover:scale-[1.01] hover:glow-primary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{farmer.farmerName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {farmer.village || 'Location not specified'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {farmer.activities.length} activities • Access expires {farmer.expiresAt ? format(new Date(farmer.expiresAt), 'MMM d') : 'Never'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
