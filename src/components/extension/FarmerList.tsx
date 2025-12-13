import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  User, 
  MapPin, 
  Calendar,
  CheckCircle
} from 'lucide-react';

interface Farmer {
  id: string;
  user_id: string;
  full_name: string;
  village_location: string | null;
  phone_number: string;
  last_activity_date?: string;
  verified_entries?: number;
}

interface FarmerListProps {
  onBack: () => void;
  onSelectFarmer: (farmerId: string) => void;
}

export function FarmerList({ onBack, onSelectFarmer }: FarmerListProps) {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddFarmer, setShowAddFarmer] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    full_name: '',
    phone_number: '',
    village_location: '',
  });

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    // Fetch farmers with role = 'farmer'
    const { data: farmerRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'farmer');

    if (farmerRoles && farmerRoles.length > 0) {
      const userIds = farmerRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      // Get activity counts for each farmer
      const farmersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('farm_activities')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          const { data: lastActivity } = await supabase
            .from('farm_activities')
            .select('activity_date')
            .eq('user_id', profile.user_id)
            .order('activity_date', { ascending: false })
            .limit(1)
            .single();

          return {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name,
            village_location: profile.village_location,
            phone_number: profile.phone_number,
            last_activity_date: lastActivity?.activity_date,
            verified_entries: count || 0,
          };
        })
      );

      setFarmers(farmersWithStats);
    }
    setLoading(false);
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmer.village_location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFarmer = async () => {
    // This would create a simple farmer profile for someone without a phone
    // In a real app, you'd handle this differently
    setShowAddFarmer(false);
    setNewFarmer({ full_name: '', phone_number: '', village_location: '' });
    fetchFarmers();
  };

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">Farmer Roster</h2>
        </div>
        <Button onClick={() => setShowAddFarmer(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Farmer
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search farmers by name or village..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Add Farmer Modal */}
      {showAddFarmer && (
        <div className="glass rounded-2xl p-6 mb-6 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add New Farmer Record</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a profile for a farmer without a phone. They can join the system later.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Full Name *</label>
              <Input
                value={newFarmer.full_name}
                onChange={(e) => setNewFarmer(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Farmer's name"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Phone (optional)</label>
              <Input
                value={newFarmer.phone_number}
                onChange={(e) => setNewFarmer(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="Phone number if available"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Village / Location</label>
              <Input
                value={newFarmer.village_location}
                onChange={(e) => setNewFarmer(prev => ({ ...prev, village_location: e.target.value }))}
                placeholder="Village or location"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddFarmer(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddFarmer} className="flex-1">
                Add Farmer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Farmer List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading farmers...</p>
        </div>
      ) : filteredFarmers.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No farmers found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery ? 'Try a different search term' : 'Add a farmer to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFarmers.map((farmer) => (
            <button
              key={farmer.id}
              onClick={() => onSelectFarmer(farmer.user_id)}
              className="w-full glass rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.01] hover:glow-primary group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {farmer.full_name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {farmer.village_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {farmer.village_location}
                        </span>
                      )}
                      {farmer.last_activity_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(farmer.last_activity_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-muted-foreground">{farmer.verified_entries} verified</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
