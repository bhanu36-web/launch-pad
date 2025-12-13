import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface MySubmissionsProps {
  onBack: () => void;
}

interface Submission {
  id: string;
  farmer_name: string;
  activity_type: string;
  activity_date: string;
  sync_status: string;
  verification_status: string;
}

export function MySubmissions({ onBack }: MySubmissionsProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    
    const { data: activities } = await supabase
      .from('farm_activities')
      .select('*')
      .order('created_at', { ascending: false });

    const mySubmissions: Submission[] = [];

    for (const activity of activities || []) {
      const extractedData = activity.ai_extracted_data as Record<string, unknown> | null;
      if (extractedData?.collected_by === user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', activity.user_id)
          .single();

        mySubmissions.push({
          id: activity.id,
          farmer_name: profile?.full_name || 'Unknown',
          activity_type: activity.activity_type,
          activity_date: activity.activity_date || '',
          sync_status: activity.sync_status || 'synced',
          verification_status: 'verified',
        });
      }
    }

    setSubmissions(mySubmissions);
    setLoading(false);
  };

  const getSyncIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.activity_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || sub.activity_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const activityTypes = ['all', ...new Set(submissions.map(s => s.activity_type))];

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">My Submissions</h2>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by farmer or activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {activityTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{submissions.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {submissions.filter(s => s.sync_status === 'synced').length}
          </p>
          <p className="text-xs text-muted-foreground">Synced</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">
            {submissions.filter(s => s.sync_status === 'pending').length}
          </p>
          <p className="text-xs text-muted-foreground">Queued</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => (
            <div
              key={sub.id}
              className="glass rounded-xl p-4 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">{sub.farmer_name}</h3>
                <div className="flex items-center gap-2">
                  {getSyncIcon(sub.sync_status)}
                  <span className="text-xs text-muted-foreground capitalize">{sub.sync_status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{sub.activity_type}</span>
                <span className="text-muted-foreground">
                  {sub.activity_date && format(new Date(sub.activity_date), 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                  Verified Entry
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
