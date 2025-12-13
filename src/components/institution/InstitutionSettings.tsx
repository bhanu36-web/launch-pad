import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  Globe,
  Save,
  Users,
  Key
} from 'lucide-react';

interface InstitutionProfile {
  organization_name: string;
  institution_type: string;
  country_region: string | null;
  representative_name: string;
  position_role: string | null;
}

export function InstitutionSettings() {
  const { user, profile } = useAuth();
  const [loading, setSaving] = useState(false);
  const [institutionData, setInstitutionData] = useState<InstitutionProfile>({
    organization_name: '',
    institution_type: '',
    country_region: '',
    representative_name: '',
    position_role: '',
  });

  useEffect(() => {
    if (user) fetchInstitutionProfile();
  }, [user]);

  const fetchInstitutionProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('institution_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setInstitutionData(data as InstitutionProfile);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('institution_profiles')
        .update({
          organization_name: institutionData.organization_name,
          institution_type: institutionData.institution_type,
          country_region: institutionData.country_region,
          representative_name: institutionData.representative_name,
          position_role: institutionData.position_role,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Organization Settings</h2>
        <p className="text-muted-foreground">Manage your institution profile and team</p>
      </div>

      {/* Organization Info */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Organization Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Organization Name</Label>
            <Input
              value={institutionData.organization_name}
              onChange={(e) => setInstitutionData({ ...institutionData, organization_name: e.target.value })}
              placeholder="Your organization name"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Institution Type</Label>
            <select
              value={institutionData.institution_type}
              onChange={(e) => setInstitutionData({ ...institutionData, institution_type: e.target.value })}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select type...</option>
              <option value="bank">Bank</option>
              <option value="insurer">Insurer</option>
              <option value="cooperative">Cooperative</option>
              <option value="government">Government</option>
              <option value="ngo">NGO</option>
            </select>
          </div>
          <div>
            <Label>Country / Region</Label>
            <Input
              value={institutionData.country_region || ''}
              onChange={(e) => setInstitutionData({ ...institutionData, country_region: e.target.value })}
              placeholder="Country or region"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Representative Name</Label>
            <Input
              value={institutionData.representative_name}
              onChange={(e) => setInstitutionData({ ...institutionData, representative_name: e.target.value })}
              placeholder="Your name"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Position / Role</Label>
            <Input
              value={institutionData.position_role || ''}
              onChange={(e) => setInstitutionData({ ...institutionData, position_role: e.target.value })}
              placeholder="Your position"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="mt-1 bg-muted"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={profile?.phone_number || ''}
              disabled
              className="mt-1 bg-muted"
            />
          </div>
        </div>
      </div>

      {/* Team Management */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members
        </h3>
        <p className="text-muted-foreground mb-4">Manage staff accounts and permissions</p>
        <Button variant="outline" disabled>
          <Users className="w-4 h-4 mr-2" />
          Add Team Member (Coming Soon)
        </Button>
      </div>

      {/* API Access */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Access
        </h3>
        <p className="text-muted-foreground mb-4">Integrate with your systems via API</p>
        <Button variant="outline" disabled>
          <Key className="w-4 h-4 mr-2" />
          Generate API Key (Coming Soon)
        </Button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
