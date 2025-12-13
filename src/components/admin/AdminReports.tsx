import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4">User Growth</h3>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <BarChart3 className="w-16 h-16" />
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Activity Volume</h3>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <BarChart3 className="w-16 h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
