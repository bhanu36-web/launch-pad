import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, CheckCircle } from 'lucide-react';

export function ExtensionWorkerManagement() {
  const [workers, setWorkers] = useState<any[]>([]);
  
  useEffect(() => {
    const fetch = async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'enumerator');
      if (roles?.length) {
        const { data } = await supabase.from('profiles').select('*').in('user_id', roles.map(r => r.user_id));
        setWorkers(data || []);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Extension Worker Management</h2>
      <div className="space-y-3">
        {workers.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No extension workers registered yet.</div>
        ) : workers.map(w => (
          <div key={w.id} className="glass rounded-xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-secondary-foreground" /></div>
              <div>
                <p className="font-medium text-foreground">{w.full_name}</p>
                <p className="text-sm text-muted-foreground">{w.village_location || 'No region'}</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
        ))}
      </div>
    </div>
  );
}
