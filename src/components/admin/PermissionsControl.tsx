import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PermissionsControl() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('access_requests').select('*').order('created_at', { ascending: false }).then(({ data }) => setRequests(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Permissions & Access Control</h2>
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No access requests yet.</div>
        ) : requests.map(r => (
          <div key={r.id} className="glass rounded-xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="font-medium text-foreground capitalize">{r.access_type}</p>
                <p className="text-sm text-muted-foreground">{r.status} • {r.duration_days} days</p>
              </div>
            </div>
            <Button variant="ghost" size="sm"><XCircle className="w-4 h-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
