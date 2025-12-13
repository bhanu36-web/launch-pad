import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Building, CheckCircle, XCircle } from 'lucide-react';

export function OrganizationManagement() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  
  useEffect(() => {
    supabase.from('institution_profiles').select('*').then(({ data }) => setInstitutions(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Organization Management</h2>
      <div className="space-y-3">
        {institutions.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No institutions registered yet.</div>
        ) : institutions.map(inst => (
          <div key={inst.id} className="glass rounded-xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center"><Building className="w-5 h-5 text-accent" /></div>
              <div>
                <p className="font-medium text-foreground">{inst.organization_name}</p>
                <p className="text-sm text-muted-foreground capitalize">{inst.institution_type} • {inst.country_region}</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
        ))}
      </div>
    </div>
  );
}
