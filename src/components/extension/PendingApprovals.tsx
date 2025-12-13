import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';

interface PendingApprovalsProps {
  onBack: () => void;
}

interface PendingEntry {
  id: string;
  farmer_name: string;
  activity_type: string;
  activity_date: string;
  status: 'pending' | 'accepted' | 'edited';
}

export function PendingApprovals({ onBack }: PendingApprovalsProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    
    // Fetch activities where this extension worker collected the data
    const { data: activities } = await supabase
      .from('farm_activities')
      .select('*')
      .not('ai_extracted_data', 'is', null);

    const pendingEntries: PendingEntry[] = [];

    for (const activity of activities || []) {
      const extractedData = activity.ai_extracted_data as Record<string, unknown> | null;
      if (extractedData?.collected_by === user?.id) {
        // Get farmer name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', activity.user_id)
          .single();

        // Determine status based on whether farmer has modified
        // For now, we'll simulate this
        pendingEntries.push({
          id: activity.id,
          farmer_name: profile?.full_name || 'Unknown',
          activity_type: activity.activity_type,
          activity_date: activity.activity_date || '',
          status: 'pending',
        });
      }
    }

    setEntries(pendingEntries);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'edited':
        return <Edit3 className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-orange-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-400';
      case 'edited':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-orange-500/20 text-orange-400';
    }
  };

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Pending Approvals</h2>
      </div>

      <p className="text-muted-foreground mb-6">
        Entries waiting for farmer confirmation
      </p>

      {/* Status Legend */}
      <div className="flex gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-muted-foreground">Accepted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-400"></div>
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span className="text-muted-foreground">Farmer Edited</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No pending approvals</p>
          <p className="text-sm text-muted-foreground mt-2">
            All your entries have been reviewed by farmers
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="glass rounded-xl p-4 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{entry.farmer_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {entry.activity_type} • {entry.activity_date && format(new Date(entry.activity_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(entry.status)}`}>
                  {getStatusIcon(entry.status)}
                  <span className="capitalize">{entry.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
