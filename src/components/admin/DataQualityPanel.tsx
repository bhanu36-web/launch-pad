import { FileCheck, CheckCircle, AlertTriangle } from 'lucide-react';

export function DataQualityPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Data Quality & Verification</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold text-foreground">95%</p>
          <p className="text-sm text-muted-foreground">Data Completeness</p>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <FileCheck className="w-12 h-12 text-accent mx-auto mb-3" />
          <p className="text-2xl font-bold text-foreground">87%</p>
          <p className="text-sm text-muted-foreground">AI Processed</p>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <p className="text-2xl font-bold text-foreground">3</p>
          <p className="text-sm text-muted-foreground">Flagged Entries</p>
        </div>
      </div>
    </div>
  );
}
