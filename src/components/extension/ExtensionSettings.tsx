import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  User, 
  Building,
  MapPin,
  Globe,
  Save,
  Download
} from 'lucide-react';

interface ExtensionSettingsProps {
  onBack: () => void;
}

export function ExtensionSettings({ onBack }: ExtensionSettingsProps) {
  const { profile, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    village_location: profile?.village_location || '',
    preferred_language: profile?.preferred_language || 'en',
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        village_location: formData.village_location,
        preferred_language: formData.preferred_language,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved!');
    }
    setSaving(false);
  };

  const handleExportData = () => {
    toast.info('Preparing data export...');
    // This would trigger a data export in a real implementation
    setTimeout(() => {
      toast.success('Export ready for download');
    }, 2000);
  };

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profile Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Full Name</label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Phone Number</label>
            <Input
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              District / Region
            </label>
            <Input
              value={formData.village_location}
              onChange={(e) => setFormData(prev => ({ ...prev, village_location: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Preferred Language
            </label>
            <select
              value={formData.preferred_language}
              onChange={(e) => setFormData(prev => ({ ...prev, preferred_language: e.target.value }))}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="fr">French</option>
            </select>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 mt-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Data Export
        </h3>
        <p className="text-sm text-muted-foreground">
          Download all your submitted entries as a CSV file
        </p>
        <Button variant="outline" onClick={handleExportData} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Export My Submissions
        </Button>
      </div>
    </div>
  );
}
