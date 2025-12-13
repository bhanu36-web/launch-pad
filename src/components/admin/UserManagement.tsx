import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Search, Ban, RefreshCw, Leaf, Building, ClipboardList, Shield } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    const { data: profiles } = await supabase.from('profiles').select('*');
    
    const merged = profiles?.map(p => ({
      ...p,
      role: roles?.find(r => r.user_id === p.user_id)?.role || 'unknown'
    })) || [];
    setUsers(merged);
    setLoading(false);
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'farmer': return <Leaf className="w-4 h-4 text-primary" />;
      case 'institution': return <Building className="w-4 h-4 text-accent" />;
      case 'enumerator': return <ClipboardList className="w-4 h-4 text-secondary-foreground" />;
      case 'admin': return <Shield className="w-4 h-4 text-destructive" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const filtered = users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <Button variant="outline" onClick={fetchUsers}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="space-y-3">
        {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filtered.map(user => (
          <div key={user.id} className="glass rounded-xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">{getRoleIcon(user.role)}</div>
              <div>
                <p className="font-medium text-foreground">{user.full_name}</p>
                <p className="text-sm text-muted-foreground capitalize">{user.role} • {user.village_location || 'No location'}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm"><Ban className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
