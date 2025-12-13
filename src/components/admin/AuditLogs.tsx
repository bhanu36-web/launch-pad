import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollText } from 'lucide-react';
import { format } from 'date-fns';

export function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => setLogs(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Audit Logs</h2>
      <div className="glass rounded-2xl p-6">
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No audit logs recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <ScrollText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="text-sm text-muted-foreground">{log.actor_type} • {format(new Date(log.created_at), 'MMM d, HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
