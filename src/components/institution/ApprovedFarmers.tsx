import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  User, 
  MapPin, 
  Calendar,
  Search,
  XCircle,
  Clock
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface ApprovedFarmer {
  id: string;
  farmerId: string;
  farmerName: string;
  village: string | null;
  expiresAt: string | null;
  accessType: string;
  approvedAt: string | null;
}

export function ApprovedFarmers() {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<ApprovedFarmer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchApprovedFarmers();
  }, [user]);

  const fetchApprovedFarmers = async () => {
    if (!user) return;

    try {
      const { data: requests } = await supabase
        .from('access_requests')
        .select('*')
        .eq('institution_id', user.id)
        .eq('status', 'approved');

      if (!requests || requests.length === 0) {
        setFarmers([]);
        setLoading(false);
        return;
      }

      const farmerIds = requests.map(r => r.farmer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, village_location')
        .in('user_id', farmerIds);

      const formattedFarmers: ApprovedFarmer[] = requests.map(request => {
        const profile = profiles?.find(p => p.user_id === request.farmer_id);
        return {
          id: request.id,
          farmerId: request.farmer_id,
          farmerName: profile?.full_name || 'Unknown',
          village: profile?.village_location,
          expiresAt: request.expires_at,
          accessType: request.access_type,
          approvedAt: request.approved_at,
        };
      });

      setFarmers(formattedFarmers);
    } catch (error) {
      console.error('Error fetching approved farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (requestId: string, farmerName: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Access to ${farmerName} revoked`);
      fetchApprovedFarmers();
    } catch (error) {
      toast.error('Failed to revoke access');
    }
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = differenceInDays(new Date(expiresAt), new Date());
    return days > 0 ? days : 0;
  };

  const filteredFarmers = farmers.filter(f =>
    f.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.village?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">My Approved Farmers</h2>
        <p className="text-muted-foreground">Farmers who have granted you access to their data</p>
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
          <p className="text-muted-foreground">Search for farmers and request access to their data.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFarmers.map((farmer) => {
            const daysRemaining = getDaysRemaining(farmer.expiresAt);
            return (
              <div key={farmer.id} className="glass rounded-2xl p-6">
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
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {daysRemaining !== null && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className={daysRemaining <= 7 ? 'text-destructive' : 'text-muted-foreground'}>
                            {daysRemaining} days remaining
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {farmer.accessType === 'view' ? 'View only' : 
                         farmer.accessType === 'view_download' ? 'View + Download' : 'Full access'}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRevokeAccess(farmer.id, farmer.farmerName)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-muted-foreground text-sm">
        You can voluntarily stop accessing a farmer's data at any time.
      </p>
    </div>
  );
}
