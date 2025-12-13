import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FolderArchive,
  Filter,
  Calendar
} from 'lucide-react';

export function DownloadData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableFarmers, setAvailableFarmers] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    crop: '',
    region: '',
    farmerGroup: '',
    verificationOnly: false,
  });

  useEffect(() => {
    if (user) fetchAvailableFarmers();
  }, [user]);

  const fetchAvailableFarmers = async () => {
    if (!user) return;

    const { data: requests } = await supabase
      .from('access_requests')
      .select('farmer_id')
      .eq('institution_id', user.id)
      .eq('status', 'approved');

    if (!requests || requests.length === 0) return;

    const farmerIds = requests.map(r => r.farmer_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', farmerIds);

    setAvailableFarmers(
      profiles?.map(p => ({ id: p.user_id, name: p.full_name })) || []
    );
  };

  const handleDownload = async (format: 'csv' | 'excel' | 'pdf' | 'zip') => {
    if (availableFarmers.length === 0) {
      toast.error('No approved farmers to download data from');
      return;
    }

    setLoading(true);
    try {
      const farmerIds = availableFarmers.map(f => f.id);
      
      let query = supabase
        .from('farm_activities')
        .select('*')
        .in('user_id', farmerIds);

      if (filters.dateFrom) {
        query = query.gte('activity_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('activity_date', filters.dateTo);
      }
      if (filters.crop) {
        query = query.ilike('crop', `%${filters.crop}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No data matches your filters');
        setLoading(false);
        return;
      }

      // Generate download based on format
      if (format === 'csv') {
        const headers = ['Date', 'Activity Type', 'Crop', 'Notes', 'Inputs Used', 'Yield Estimate', 'AI Summary'];
        const rows = data.map(d => [
          d.activity_date,
          d.activity_type,
          d.crop || '',
          d.notes || '',
          d.inputs_used || '',
          d.yield_estimate || '',
          d.ai_summary || '',
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `farm_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('CSV downloaded successfully');
      } else {
        toast.info(`${format.toUpperCase()} export coming soon!`);
      }
    } catch (error) {
      toast.error('Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Download Data</h2>
        <p className="text-muted-foreground">Export farm data in various formats</p>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Date From</Label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <Label>Date To</Label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <Label>Crop</Label>
            <input
              type="text"
              placeholder="Filter by crop..."
              value={filters.crop}
              onChange={(e) => setFilters({ ...filters, crop: e.target.value })}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <Label>Region</Label>
            <input
              type="text"
              placeholder="Filter by region..."
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.verificationOnly}
                onChange={(e) => setFilters({ ...filters, verificationOnly: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-muted-foreground">Verified entries only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Download Options */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Export Formats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleDownload('csv')}
            disabled={loading}
            className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center group"
          >
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">CSV File</p>
            <p className="text-xs text-muted-foreground">Spreadsheet format</p>
          </button>
          
          <button
            onClick={() => handleDownload('excel')}
            disabled={loading}
            className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center group"
          >
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-accent group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">Excel Sheet</p>
            <p className="text-xs text-muted-foreground">.xlsx format</p>
          </button>
          
          <button
            onClick={() => handleDownload('pdf')}
            disabled={loading}
            className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center group"
          >
            <FileText className="w-10 h-10 mx-auto mb-3 text-destructive group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">PDF Summary</p>
            <p className="text-xs text-muted-foreground">Report format</p>
          </button>
          
          <button
            onClick={() => handleDownload('zip')}
            disabled={loading}
            className="p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-center group"
          >
            <FolderArchive className="w-10 h-10 mx-auto mb-3 text-secondary-foreground group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">Evidence Bundle</p>
            <p className="text-xs text-muted-foreground">All files zipped</p>
          </button>
        </div>
      </div>

      {/* Available Data */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Available Data</h3>
        <p className="text-muted-foreground mb-4">
          You have access to data from <span className="text-primary font-semibold">{availableFarmers.length}</span> farmers.
        </p>
        {availableFarmers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableFarmers.slice(0, 10).map(farmer => (
              <span key={farmer.id} className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                {farmer.name}
              </span>
            ))}
            {availableFarmers.length > 10 && (
              <span className="px-3 py-1 bg-primary/20 rounded-full text-sm text-primary">
                +{availableFarmers.length - 10} more
              </span>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-muted-foreground text-sm">
        Data download ready. Your session is secure.
      </p>
    </div>
  );
}
