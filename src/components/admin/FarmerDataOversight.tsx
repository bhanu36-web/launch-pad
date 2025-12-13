import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Leaf, Search, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FarmerDataOversight() {
  const [activities, setActivities] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('farm_activities').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => setActivities(data || []));
  }, []);

  const filtered = activities.filter(a => a.crop?.toLowerCase().includes(search.toLowerCase()) || a.activity_type.includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Farmer Data Oversight</h2>
      <div className="glass rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="space-y-3">
        {filtered.map(a => (
          <div key={a.id} className="glass rounded-xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Leaf className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="font-medium text-foreground capitalize">{a.activity_type}</p>
                <p className="text-sm text-muted-foreground">{a.crop || 'No crop'} • {new Date(a.activity_date).toLocaleDateString()}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm"><Flag className="w-4 h-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
