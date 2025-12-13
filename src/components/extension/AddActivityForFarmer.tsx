import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ArrowLeft, 
  ArrowRight,
  Sprout, 
  Droplets, 
  Bug, 
  Scissors,
  Wheat,
  MoreHorizontal,
  Camera,
  Video,
  Mic,
  FileText,
  MapPin,
  Check,
  Loader2,
  CalendarIcon,
  Shield,
  User
} from 'lucide-react';

interface AddActivityForFarmerProps {
  onBack: () => void;
  selectedFarmerId: string | null;
  isOnline: boolean;
  onQueueEntry: (entry: { id: string; data: Record<string, unknown>; timestamp: string }) => void;
}

type Step = 'select-farmer' | 'activity-type' | 'form' | 'evidence' | 'geo-tag' | 'preview';

const activityTypes = [
  { id: 'planting', label: 'Planting', icon: Sprout },
  { id: 'fertilizer', label: 'Fertilizer', icon: Droplets },
  { id: 'pest_control', label: 'Pest Control', icon: Bug },
  { id: 'irrigation', label: 'Irrigation', icon: Droplets },
  { id: 'harvest', label: 'Harvest', icon: Wheat },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
];

interface Farmer {
  id: string;
  user_id: string;
  full_name: string;
  village_location: string | null;
}

interface Field {
  id: string;
  name: string;
}

export function AddActivityForFarmer({ onBack, selectedFarmerId, isOnline, onQueueEntry }: AddActivityForFarmerProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>(selectedFarmerId ? 'activity-type' : 'select-farmer');
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [activityType, setActivityType] = useState('');
  const [activityDate, setActivityDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    field_id: '',
    crop: '',
    notes: '',
    inputs_used: '',
    yield_estimate: '',
  });
  const [evidence, setEvidence] = useState<{ type: string; data: string }[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFarmers();
  }, []);

  useEffect(() => {
    if (selectedFarmerId) {
      fetchFarmerById(selectedFarmerId);
    }
  }, [selectedFarmerId]);

  useEffect(() => {
    if (selectedFarmer) {
      fetchFields(selectedFarmer.user_id);
    }
  }, [selectedFarmer]);

  const fetchFarmers = async () => {
    const { data: farmerRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'farmer');

    if (farmerRoles) {
      const userIds = farmerRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      setFarmers((profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        village_location: p.village_location,
      })));
    }
  };

  const fetchFarmerById = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setSelectedFarmer({
        id: data.id,
        user_id: data.user_id,
        full_name: data.full_name,
        village_location: data.village_location,
      });
    }
  };

  const fetchFields = async (userId: string) => {
    const { data } = await supabase
      .from('fields')
      .select('id, name')
      .eq('user_id', userId);
    setFields(data || []);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success('Location captured!');
        },
        (error) => {
          toast.error('Could not get location');
        }
      );
    }
  };

  const handleProcessEvidence = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-farm-activity', {
        body: {
          activityType,
          notes: formData.notes,
          crop: formData.crop,
          inputsUsed: formData.inputs_used,
          evidence: evidence,
        },
      });

      if (error) throw error;
      setAiSummary(data.summary || 'Activity recorded by extension worker.');
    } catch (e) {
      setAiSummary(`${activityType} activity for ${formData.crop || 'crop'}. Collected by extension worker - verified source.`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async (syncNow: boolean) => {
    if (!selectedFarmer || !user) return;
    setSaving(true);

    const activityData = {
      user_id: selectedFarmer.user_id,
      activity_type: activityType,
      activity_date: activityDate.toISOString(),
      field_id: formData.field_id || null,
      crop: formData.crop,
      notes: formData.notes,
      inputs_used: formData.inputs_used,
      yield_estimate: formData.yield_estimate,
      location_lat: location?.lat,
      location_lng: location?.lng,
      ai_summary: aiSummary + ' — Collected by Extension Worker (Verified Source)',
      ai_extracted_data: {
        collected_by: user.id,
        collector_name: profile?.full_name,
        verification_level: 'extension_worker',
        evidence_types: evidence.map(e => e.type),
      },
      sync_status: syncNow && isOnline ? 'synced' : 'pending',
    };

    if (syncNow && isOnline) {
      const { error } = await supabase.from('farm_activities').insert(activityData);
      if (error) {
        toast.error('Failed to save activity');
        setSaving(false);
        return;
      }
      toast.success('Saved and synced as verified entry!');
    } else {
      onQueueEntry({
        id: crypto.randomUUID(),
        data: activityData,
        timestamp: new Date().toISOString(),
      });
      toast.success('Saved locally — will sync later');
    }

    setSaving(false);
    onBack();
  };

  const renderStep = () => {
    switch (step) {
      case 'select-farmer':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Select a farmer to begin recording.</p>
            {farmers.map((farmer) => (
              <button
                key={farmer.id}
                onClick={() => {
                  setSelectedFarmer(farmer);
                  setStep('activity-type');
                }}
                className="w-full glass rounded-xl p-4 text-left transition-all hover:scale-[1.01] hover:glow-primary"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{farmer.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{farmer.village_location || 'Unknown location'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        );

      case 'activity-type':
        return (
          <div className="space-y-4">
            {selectedFarmer && (
              <div className="glass rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground">Recording for:</p>
                <p className="font-semibold text-foreground">{selectedFarmer.full_name}</p>
              </div>
            )}
            <p className="text-muted-foreground">Choose Activity Type</p>
            <div className="grid grid-cols-3 gap-3">
              {activityTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setActivityType(type.id);
                    setStep('form');
                  }}
                  className="glass rounded-xl p-4 text-center transition-all hover:scale-[1.02] hover:glow-primary group"
                >
                  <type.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <span className="text-sm text-foreground">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(activityDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={activityDate}
                    onSelect={(date) => date && setActivityDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Field</label>
              <select
                value={formData.field_id}
                onChange={(e) => setFormData(prev => ({ ...prev, field_id: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select field...</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Crop *</label>
              <Input
                value={formData.crop}
                onChange={(e) => setFormData(prev => ({ ...prev, crop: e.target.value }))}
                placeholder="e.g., Maize, Beans"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Short description of the activity"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Inputs Used (optional)</label>
              <Input
                value={formData.inputs_used}
                onChange={(e) => setFormData(prev => ({ ...prev, inputs_used: e.target.value }))}
                placeholder="e.g., DAP 50kg, Seeds 10kg"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Yield Estimate (optional)</label>
              <Input
                value={formData.yield_estimate}
                onChange={(e) => setFormData(prev => ({ ...prev, yield_estimate: e.target.value }))}
                placeholder="e.g., 20 bags expected"
              />
            </div>

            <Button onClick={() => setStep('evidence')} className="w-full">
              Next: Attach Evidence <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'evidence':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Attach photo or record voice for accuracy.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'photo', icon: Camera, label: 'Photo' },
                { type: 'video', icon: Video, label: 'Video' },
                { type: 'audio', icon: Mic, label: 'Audio Note' },
                { type: 'text', icon: FileText, label: 'Text Note' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => {
                    setEvidence(prev => [...prev, { type: item.type, data: 'placeholder' }]);
                    toast.success(`${item.label} added`);
                  }}
                  className="glass rounded-xl p-6 text-center transition-all hover:scale-[1.02] hover:glow-primary"
                >
                  <item.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
            {evidence.length > 0 && (
              <p className="text-sm text-green-400">{evidence.length} evidence item(s) attached</p>
            )}
            <Button onClick={() => setStep('geo-tag')} className="w-full">
              Next: Geo-tag <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'geo-tag':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Add location for verification</p>
            <div className="glass rounded-xl p-6 text-center">
              {location ? (
                <div>
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="text-foreground font-medium">Location Captured</p>
                  <p className="text-sm text-muted-foreground">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div>
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <Button onClick={handleGetLocation}>
                    Use GPS Location
                  </Button>
                </div>
              )}
            </div>
            <Button 
              onClick={() => {
                handleProcessEvidence();
                setStep('preview');
              }} 
              className="w-full"
            >
              Next: Preview <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            {/* Verification Badge */}
            <div className="glass rounded-xl p-4 border border-green-500/30 bg-green-500/10">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-400" />
                <div>
                  <p className="font-semibold text-green-400">Collected by Extension Worker</p>
                  <p className="text-sm text-muted-foreground">Verified Source</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-3">Activity Summary</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Farmer:</span> {selectedFarmer?.full_name}</p>
                <p><span className="text-muted-foreground">Type:</span> {activityType}</p>
                <p><span className="text-muted-foreground">Crop:</span> {formData.crop}</p>
                <p><span className="text-muted-foreground">Date:</span> {format(activityDate, 'dd/MM/yyyy')}</p>
                {formData.notes && <p><span className="text-muted-foreground">Notes:</span> {formData.notes}</p>}
              </div>
            </div>

            {processing ? (
              <div className="text-center py-4">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Processing with AI...</p>
              </div>
            ) : aiSummary && (
              <div className="glass rounded-xl p-4 border border-primary/30">
                <h4 className="text-sm font-medium text-primary mb-2">AI Summary</h4>
                <p className="text-sm text-foreground">{aiSummary}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              This activity has been added. Pending farmer review (optional).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                Save & Queue
              </Button>
              <Button 
                onClick={() => handleSave(true)}
                disabled={saving || !isOnline}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save & Sync
              </Button>
            </div>
          </div>
        );
    }
  };

  const getStepTitle = () => {
    const titles: Record<Step, string> = {
      'select-farmer': 'Select Farmer',
      'activity-type': 'Activity Type',
      'form': 'Activity Details',
      'evidence': 'Attach Evidence',
      'geo-tag': 'Geo-tagging',
      'preview': 'Review & Save',
    };
    return titles[step];
  };

  const handleBack = () => {
    const stepOrder: Step[] = ['select-farmer', 'activity-type', 'form', 'evidence', 'geo-tag', 'preview'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    } else {
      onBack();
    }
  };

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-foreground">{getStepTitle()}</h2>
      </div>

      {renderStep()}
    </div>
  );
}
