import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
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
  X,
  Upload,
  CalendarIcon,
  Plus,
} from 'lucide-react';

interface AddActivityFlowProps {
  onClose: () => void;
  onSave: () => void;
}

type Step = 'type' | 'details' | 'evidence' | 'location' | 'preview';
type ActivityType = 'Planting' | 'Fertilizer' | 'Pest' | 'Irrigation' | 'Harvest' | 'Other';

const activityTypes: { id: ActivityType; icon: any; label: string }[] = [
  { id: 'Planting', icon: Sprout, label: 'Planting' },
  { id: 'Fertilizer', icon: Droplets, label: 'Fertilizer' },
  { id: 'Pest', icon: Bug, label: 'Pest' },
  { id: 'Irrigation', icon: Droplets, label: 'Irrigation' },
  { id: 'Harvest', icon: Wheat, label: 'Harvest' },
  { id: 'Other', icon: MoreHorizontal, label: 'Other' },
];

export function AddActivityFlow({ onClose, onSave }: AddActivityFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('type');
  const [loading, setLoading] = useState(false);
  const [processingAI, setProcessingAI] = useState(false);
  
  const [formData, setFormData] = useState({
    activityType: '' as ActivityType | '',
    activityDate: new Date(),
    fieldId: '',
    fieldName: '',
    crop: '',
    notes: '',
    inputsUsed: '',
    yieldEstimate: '',
    locationLat: null as number | null,
    locationLng: null as number | null,
  });

  const [fields, setFields] = useState<{ id: string; name: string }[]>([]);
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');

  useEffect(() => {
    if (user) {
      fetchFields();
    }
  }, [user]);

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from('fields')
      .select('id, name')
      .eq('user_id', user?.id);
    
    if (!error && data) {
      setFields(data);
    }
  };

  const handleAddField = async () => {
    if (!newFieldName.trim() || !user) return;
    
    const { data, error } = await supabase
      .from('fields')
      .insert({ user_id: user.id, name: newFieldName.trim() })
      .select()
      .single();
    
    if (!error && data) {
      setFields(prev => [...prev, { id: data.id, name: data.name }]);
      setFormData(prev => ({ ...prev, fieldId: data.id, fieldName: data.name }));
      setNewFieldName('');
      setShowNewField(false);
      toast.success('Field added!');
    }
  };

  const [evidence, setEvidence] = useState<{
    photos: File[];
    videos: File[];
    audioNotes: Blob[];
    textNotes: string;
  }>({
    photos: [],
    videos: [],
    audioNotes: [],
    textNotes: '',
  });

  const [aiSummary, setAiSummary] = useState('');
  const [aiExtractedData, setAiExtractedData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleActivityTypeSelect = (type: ActivityType) => {
    setFormData(prev => ({ ...prev, activityType: type }));
    setStep('details');
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidence(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
  };

  const handleVideoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidence(prev => ({ ...prev, videos: [...prev.videos, ...files] }));
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setEvidence(prev => ({ ...prev, audioNotes: [...prev.audioNotes, blob] }));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Could not access microphone');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            locationLat: position.coords.latitude,
            locationLng: position.coords.longitude,
          }));
          toast.success('Location captured!');
        },
        () => toast.error('Could not get location')
      );
    }
  };

  const processWithAI = async () => {
    setProcessingAI(true);
    
    try {
      // Build context from all evidence
      const context = {
        activityType: formData.activityType,
        crop: formData.crop,
        notes: formData.notes,
        textNotes: evidence.textNotes,
        inputsUsed: formData.inputsUsed,
        photoCount: evidence.photos.length,
        audioCount: evidence.audioNotes.length,
      };

      const { data, error } = await supabase.functions.invoke('process-farm-activity', {
        body: { context },
      });

      if (error) throw error;

      setAiSummary(data.summary || 'Activity recorded successfully.');
      setAiExtractedData(data.extractedData || {});
      
    } catch (err) {
      console.error('AI processing error:', err);
      // Fallback summary if AI fails
      setAiSummary(`${formData.activityType} activity for ${formData.crop || 'crops'}. ${formData.notes || ''}`);
    } finally {
      setProcessingAI(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const isOnline = navigator.onLine;

      const { error } = await supabase.from('farm_activities').insert({
        user_id: user.id,
        activity_type: formData.activityType,
        crop: formData.crop || null,
        notes: formData.notes || null,
        inputs_used: formData.inputsUsed || null,
        yield_estimate: formData.yieldEstimate || null,
        location_lat: formData.locationLat,
        location_lng: formData.locationLng,
        ai_summary: aiSummary,
        ai_extracted_data: aiExtractedData,
        sync_status: isOnline ? 'synced' : 'pending',
        activity_date: formData.activityDate.toISOString(),
      });

      if (error) throw error;

      toast.success(isOnline ? 'Saved and synced!' : 'Saved locally — will sync when online.');
      onSave();
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    const steps: Step[] = ['type', 'details', 'evidence', 'location', 'preview'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      if (steps[currentIndex + 1] === 'preview') {
        processWithAI();
      }
      setStep(steps[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const steps: Step[] = ['type', 'details', 'evidence', 'location', 'preview'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    } else {
      onClose();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousStep}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground">Add New Activity</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Step 1: Activity Type */}
        {step === 'type' && (
          <div className="animate-fade-in-up">
            <h2 className="text-xl font-semibold text-foreground mb-2">Choose Activity Type</h2>
            <p className="text-muted-foreground mb-6">What did you do on your farm?</p>
            
            <div className="grid grid-cols-2 gap-4">
              {activityTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleActivityTypeSelect(type.id)}
                  className="glass rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:glow-primary group"
                >
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
                    <type.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary">{type.label}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="animate-fade-in-up space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">Fill Quick Form</h2>
            
            <div className="glass rounded-2xl p-6 space-y-4">
              {/* Date Picker */}
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !formData.activityDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.activityDate ? format(formData.activityDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.activityDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, activityDate: date }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Field Select */}
              <div>
                <Label>Field</Label>
                {!showNewField ? (
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={formData.fieldId}
                      onValueChange={(value) => {
                        const field = fields.find(f => f.id === value);
                        setFormData(prev => ({ ...prev, fieldId: value, fieldName: field?.name || '' }));
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setShowNewField(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="Enter field name"
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={handleAddField}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowNewField(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Crop */}
              <div>
                <Label htmlFor="crop">Crop</Label>
                <Input
                  id="crop"
                  value={formData.crop}
                  onChange={(e) => setFormData(prev => ({ ...prev, crop: e.target.value }))}
                  placeholder="e.g., Maize, Beans, Tomatoes"
                  className="mt-1"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Short description of the activity..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Inputs Used */}
              <div>
                <Label htmlFor="inputsUsed">Inputs Used (optional)</Label>
                <Input
                  id="inputsUsed"
                  value={formData.inputsUsed}
                  onChange={(e) => setFormData(prev => ({ ...prev, inputsUsed: e.target.value }))}
                  placeholder="e.g., DAP fertilizer, 50kg"
                  className="mt-1"
                />
              </div>

              {/* Yield Estimate */}
              <div>
                <Label htmlFor="yieldEstimate">Yield Estimate (optional)</Label>
                <Input
                  id="yieldEstimate"
                  value={formData.yieldEstimate}
                  onChange={(e) => setFormData(prev => ({ ...prev, yieldEstimate: e.target.value }))}
                  placeholder="e.g., 2 tons per acre"
                  className="mt-1"
                />
              </div>

              <Button onClick={goToNextStep} className="w-full">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Evidence */}
        {step === 'evidence' && (
          <div className="animate-fade-in-up space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">Attach Evidence</h2>
            <p className="text-muted-foreground mb-4">AI will process your media into text summaries</p>
            
            <div className="glass rounded-2xl p-6 space-y-4">
              {/* Photo */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                  multiple
                />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-5 h-5" />
                  Take Photo or Upload
                  {evidence.photos.length > 0 && (
                    <span className="ml-auto text-primary">{evidence.photos.length} photos</span>
                  )}
                </Button>
              </div>

              {/* Video */}
              <div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  capture="environment"
                  onChange={handleVideoCapture}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video className="w-5 h-5" />
                  Record Video
                  {evidence.videos.length > 0 && (
                    <span className="ml-auto text-primary">{evidence.videos.length} videos</span>
                  )}
                </Button>
              </div>

              {/* Audio */}
              <div>
                <Button
                  variant={isRecording ? 'destructive' : 'outline'}
                  className="w-full justify-start gap-3"
                  onClick={isRecording ? stopAudioRecording : startAudioRecording}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                  {isRecording ? 'Stop Recording' : 'Record Audio Note'}
                  {evidence.audioNotes.length > 0 && !isRecording && (
                    <span className="ml-auto text-primary">{evidence.audioNotes.length} notes</span>
                  )}
                </Button>
              </div>

              {/* Text Note */}
              <div>
                <Label htmlFor="textNote">Text Note</Label>
                <Textarea
                  id="textNote"
                  value={evidence.textNotes}
                  onChange={(e) => setEvidence(prev => ({ ...prev, textNotes: e.target.value }))}
                  placeholder="Add any additional notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button onClick={goToNextStep} className="w-full">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Location */}
        {step === 'location' && (
          <div className="animate-fade-in-up space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">Geo-tagging</h2>
            <p className="text-muted-foreground mb-4">Add location to your activity</p>
            
            <div className="glass rounded-2xl p-6 space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={getLocation}
              >
                <MapPin className="w-5 h-5" />
                {formData.locationLat ? 'Location Captured' : 'Use GPS Location'}
                {formData.locationLat && <Check className="ml-auto w-5 h-5 text-primary" />}
              </Button>

              {formData.locationLat && (
                <p className="text-sm text-muted-foreground">
                  Lat: {formData.locationLat.toFixed(4)}, Lng: {formData.locationLng?.toFixed(4)}
                </p>
              )}

              <Button onClick={goToNextStep} className="w-full">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Preview */}
        {step === 'preview' && (
          <div className="animate-fade-in-up space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">Preview & Save</h2>
            
            <div className="glass rounded-2xl p-6 space-y-4">
              {processingAI ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">AI is processing your activity...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Activity:</span>
                      <span className="font-medium text-foreground">{formData.activityType}</span>
                    </div>
                    
                    {formData.crop && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Crop:</span>
                        <span className="font-medium text-foreground">{formData.crop}</span>
                      </div>
                    )}

                    {formData.locationLat && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Location tagged</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {evidence.photos.length > 0 && <span>{evidence.photos.length} photos</span>}
                      {evidence.videos.length > 0 && <span>{evidence.videos.length} videos</span>}
                      {evidence.audioNotes.length > 0 && <span>{evidence.audioNotes.length} audio notes</span>}
                    </div>
                  </div>

                  {aiSummary && (
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <h4 className="font-medium text-primary mb-2">AI Summary</h4>
                      <p className="text-sm text-foreground">{aiSummary}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Queue'}
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Sync'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
