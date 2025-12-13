import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Search, 
  User, 
  MapPin, 
  CheckCircle, 
  Lock,
  Send,
  Filter
} from 'lucide-react';

interface FarmerResult {
  id: string;
  full_name: string;
  village_location: string | null;
  hasPermission: boolean;
  verifiedEntries: number;
}

export function FindFarmers() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    verifiedOnly: false,
    extensionVerified: false,
  });
  const [results, setResults] = useState<FarmerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerResult | null>(null);
  const [requestForm, setRequestForm] = useState({
    reason: '',
    accessType: 'view',
    duration: 30,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      // Search farmers by name or village
      const { data: farmers } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, village_location')
        .or(`full_name.ilike.%${searchQuery}%,village_location.ilike.%${searchQuery}%`)
        .limit(20);

      if (!farmers || farmers.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Check which farmers have granted permission
      const { data: permissions } = await supabase
        .from('access_requests')
        .select('farmer_id, status')
        .eq('institution_id', user?.id)
        .in('farmer_id', farmers.map(f => f.user_id));

      // Get verified entry counts
      const farmerIds = farmers.map(f => f.user_id);
      const { data: activities } = await supabase
        .from('farm_activities')
        .select('user_id')
        .in('user_id', farmerIds);

      const entryCounts: Record<string, number> = {};
      activities?.forEach(a => {
        entryCounts[a.user_id] = (entryCounts[a.user_id] || 0) + 1;
      });

      const formattedResults: FarmerResult[] = farmers.map(farmer => ({
        id: farmer.user_id,
        full_name: farmer.full_name,
        village_location: farmer.village_location,
        hasPermission: permissions?.some(p => p.farmer_id === farmer.user_id && p.status === 'approved') || false,
        verifiedEntries: entryCounts[farmer.user_id] || 0,
      }));

      setResults(formattedResults);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = (farmer: FarmerResult) => {
    setSelectedFarmer(farmer);
    setShowRequestModal(true);
  };

  const submitAccessRequest = async () => {
    if (!selectedFarmer || !user) return;

    try {
      const { error } = await supabase.from('access_requests').insert({
        institution_id: user.id,
        farmer_id: selectedFarmer.id,
        request_reason: requestForm.reason,
        access_type: requestForm.accessType,
        duration_days: requestForm.duration,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Access request sent to farmer.');
      setShowRequestModal(false);
      setRequestForm({ reason: '', accessType: 'view', duration: 30 });
      handleSearch(); // Refresh results
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Find Farmers</h2>
        <p className="text-muted-foreground">Search for farmers and request access to their data</p>
      </div>

      {/* Search Bar */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, phone, village, or crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
              className="rounded"
            />
            <CheckCircle className="w-4 h-4" />
            Verified records only
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={filters.extensionVerified}
              onChange={(e) => setFilters({ ...filters, extensionVerified: e.target.checked })}
              className="rounded"
            />
            <Filter className="w-4 h-4" />
            Extension worker verified
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.length === 0 && searchQuery && !loading && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No farmers found matching your search.</p>
          </div>
        )}

        {results.map((farmer) => (
          <div key={farmer.id} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{farmer.full_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {farmer.village_location || 'Location not specified'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {farmer.verifiedEntries} verified entries
                  </p>
                </div>
              </div>

              <div>
                {farmer.hasPermission ? (
                  <Button variant="outline" size="sm" className="text-primary">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Access Granted
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleRequestAccess(farmer)}>
                    <Send className="w-4 h-4 mr-2" />
                    Request Access
                  </Button>
                )}
              </div>
            </div>

            {!farmer.hasPermission && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Lock className="w-4 h-4" />
                This farmer exists but requires permission for access.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Request Access Modal */}
      {showRequestModal && selectedFarmer && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">Request Access</h3>
            <p className="text-muted-foreground mb-6">
              Request access to {selectedFarmer.full_name}'s farm data
            </p>

            <div className="space-y-4">
              <div>
                <Label>Why do you need this data?</Label>
                <textarea
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  placeholder="Explain your purpose..."
                  className="mt-1 w-full h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <Label>Access Type</Label>
                <select
                  value={requestForm.accessType}
                  onChange={(e) => setRequestForm({ ...requestForm, accessType: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="view">View only</option>
                  <option value="view_download">View + Download</option>
                  <option value="view_download_analytics">View + Download + Analytics</option>
                </select>
              </div>

              <div>
                <Label>Duration</Label>
                <select
                  value={requestForm.duration}
                  onChange={(e) => setRequestForm({ ...requestForm, duration: parseInt(e.target.value) })}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={365}>1 year</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowRequestModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={submitAccessRequest} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
