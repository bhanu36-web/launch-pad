import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function SystemSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">System Settings</h2>
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Settings className="w-5 h-5" />Platform Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Auto-confirm email signups</Label>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <Label>Require 2FA for admins</Label>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <Label>Default access duration (days)</Label>
            <input type="number" defaultValue={30} className="w-20 h-8 rounded border px-2" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button><Save className="w-4 h-4 mr-2" />Save Settings</Button>
      </div>
    </div>
  );
}
