import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Share2,
  Building,
  Landmark,
  Users,
  ShieldCheck,
  Eye,
  Download,
  X,
  Plus,
  Check,
} from 'lucide-react';

interface Permission {
  id: string;
  shared_with_email: string;
  shared_with_type: string;
  permission_type: string;
  data_range: string;
  is_active: boolean;
  created_at: string;
}

const shareTypes = [
  { id: 'insurer', label: 'Insurer', icon: ShieldCheck },
  { id: 'bank', label: 'Bank', icon: Landmark },
  { id: 'cooperative', label: 'Cooperative', icon: Users },
  { id: 'government', label: 'Government Program', icon: Building },
];

export function SharePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    type: 'insurer',
    permissionType: 'view',
    dataRange: 'full',
  });

  useEffect(() => {
    fetchPermissions();
  }, [user]);

  const fetchPermissions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('data_permissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPermissions(data as Permission[]);
    }
    setLoading(false);
  };

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('data_permissions').insert({
      user_id: user.id,
      shared_with_email: formData.email,
      shared_with_type: formData.type,
      permission_type: formData.permissionType,
      data_range: formData.dataRange,
      is_active: true,
    });

    if (error) {
      toast.error('Failed to add permission');
      return;
    }

    toast.success('Access granted!');
    setShowAddForm(false);
    setFormData({ email: '', type: 'insurer', permissionType: 'view', dataRange: 'full' });
    fetchPermissions();
  };

  const handleRevokePermission = async (id: string) => {
    const { error } = await supabase
      .from('data_permissions')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast.error('Failed to revoke access');
      return;
    }

    toast.success('Access revoked!');
    fetchPermissions();
  };

  const getTypeIcon = (type: string) => {
    const found = shareTypes.find(t => t.id === type);
    return found?.icon || Building;
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Share / Permissions</h2>
        <Button onClick={() => setShowAddForm(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        Control who can access your farm records. You can revoke access at any time.
      </p>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Grant Access</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleAddPermission} className="space-y-4">
            <div>
              <Label>Share with (Email)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="institution@example.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label>Institution Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {shareTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      formData.type === type.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <type.icon className="w-5 h-5 mb-1" />
                    <p className="text-sm font-medium">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Data Range</Label>
              <select
                value={formData.dataRange}
                onChange={(e) => setFormData(prev => ({ ...prev, dataRange: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="3months">Last 3 months</option>
                <option value="full">Full history</option>
                <option value="verified">Verified only</option>
              </select>
            </div>

            <div>
              <Label>Permission Type</Label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, permissionType: 'view' }))}
                  className={`flex-1 p-3 rounded-lg border flex items-center gap-2 ${
                    formData.permissionType === 'view'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  View Only
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, permissionType: 'download' }))}
                  className={`flex-1 p-3 rounded-lg border flex items-center gap-2 ${
                    formData.permissionType === 'download'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Grant Access
            </Button>
          </form>
        </div>
      )}

      {/* Permissions List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : permissions.filter(p => p.is_active).length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Share2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No active shares</p>
          <p className="text-sm text-muted-foreground mt-1">
            Grant access to institutions to share your farm records
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {permissions.filter(p => p.is_active).map((permission) => {
            const Icon = getTypeIcon(permission.shared_with_type);
            
            return (
              <div
                key={permission.id}
                className="glass rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-secondary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{permission.shared_with_email}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{permission.shared_with_type}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {permission.permission_type === 'view' ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <Download className="w-3 h-3" />
                      )}
                      {permission.permission_type}
                    </span>
                    <span>•</span>
                    <span>{permission.data_range}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokePermission(permission.id)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  Revoke
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
