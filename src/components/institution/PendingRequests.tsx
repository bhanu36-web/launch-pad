import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Clock, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface AccessRequest {
  id: string;
  farmer_id: string;
  farmer_name: string;
  request_reason: string | null;
  access_type: string;
  duration_days: number;
  status: string;
  created_at: string;
}

interface PendingRequestsProps {
  onRefresh?: () => void;
}

export function PendingRequests({ onRefresh }: PendingRequestsProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data: requestsData } = await supabase
        .from('access_requests')
        .select('*')
        .eq('institution_id', user.id)
        .order('created_at', { ascending: false });

      if (!requestsData) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Get farmer names
      const farmerIds = requestsData.map(r => r.farmer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', farmerIds);

      const formattedRequests: AccessRequest[] = requestsData.map(req => ({
        ...req,
        farmer_name: profiles?.find(p => p.user_id === req.farmer_id)?.full_name || 'Unknown',
      }));

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-primary bg-primary/20';
      case 'rejected':
        return 'text-destructive bg-destructive/20';
      case 'expired':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-yellow-500 bg-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getAccessTypeLabel = (type: string) => {
    switch (type) {
      case 'view':
        return 'View only';
      case 'view_download':
        return 'View + Download';
      case 'view_download_analytics':
        return 'View + Download + Analytics';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Requests</h2>
          <p className="text-muted-foreground">Track your data access requests to farmers</p>
        </div>
        <Button variant="outline" onClick={() => { fetchRequests(); onRefresh?.(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Pending Requests */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Pending ({pendingRequests.length})</h3>
        {pendingRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No pending requests</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{request.farmer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getAccessTypeLabel(request.access_type)} • {request.duration_days} days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('pending')}`}>
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {request.request_reason && (
                  <p className="text-sm text-muted-foreground mt-2 ml-14">
                    Reason: {request.request_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">History ({processedRequests.length})</h3>
        {processedRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No processed requests</p>
        ) : (
          <div className="space-y-4">
            {processedRequests.map((request) => (
              <div key={request.id} className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{request.farmer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getAccessTypeLabel(request.access_type)} • {request.duration_days} days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Microcopy */}
      <p className="text-center text-muted-foreground text-sm">
        Farmers control who can access their data. Permission expired? Request new access.
      </p>
    </div>
  );
}
