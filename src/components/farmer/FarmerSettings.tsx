import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  User,
  Phone,
  MapPin,
  Globe,
  Download,
  FileText,
  Save,
  Loader2,
} from 'lucide-react';

export function FarmerSettings() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phoneNumber: profile?.phone_number || '',
    villageLocation: profile?.village_location || '',
    preferredLanguage: profile?.preferred_language || 'en',
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        village_location: formData.villageLocation,
        preferred_language: formData.preferredLanguage,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
    }
    setLoading(false);
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    toast.info(`Exporting as ${format.toUpperCase()}...`);
    // In a real app, this would trigger a download
  };

  return (
    <div className="animate-fade-in-up space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Settings</h2>

      {/* Profile Settings */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Information
        </h3>

        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="mt-1 pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="villageLocation">Village / Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="villageLocation"
              value={formData.villageLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, villageLocation: e.target.value }))}
              className="mt-1 pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="preferredLanguage">Preferred Language</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              id="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={(e) => setFormData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background pl-10 pr-3 text-sm"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Export Options */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Data
        </h3>
        <p className="text-sm text-muted-foreground">
          Download your farm records for personal use or sharing with institutions.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4" />
            Export as PDF
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4" />
            Export as CSV
          </Button>
        </div>
      </div>

      {/* Help Tips */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Use clear photos for better AI summaries</li>
          <li>• Log activities regularly for accurate records</li>
          <li>• Keep your location updated for geo-tagging</li>
          <li>• Review your season summary to track progress</li>
        </ul>
      </div>
    </div>
  );
}
