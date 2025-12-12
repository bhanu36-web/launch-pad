import { useState } from 'react';
import { ArrowLeft, Smartphone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface GetStartedPageProps {
  onNavigate: (page: string, data?: { name: string; location: string; farmSize: string }) => void;
}

interface FormData {
  name: string;
  phone: string;
  location: string;
  farmSize: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  location?: string;
  farmSize?: string;
}

export function GetStartedPage({ onNavigate }: GetStartedPageProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    location: '',
    farmSize: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    if (!formData.location.trim()) errors.location = 'Farm location is required';
    if (!formData.farmSize || parseFloat(formData.farmSize) <= 0) {
      errors.farmSize = 'Please enter a valid farm size';
    }
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    toast.success(`Welcome to AgriLog, ${formData.name}!`, {
      description: 'Your account has been created. Redirecting to your dashboard...',
    });

    // Pass user data to dashboard
    setTimeout(() => {
      onNavigate('dashboard', {
        name: formData.name,
        location: formData.location,
        farmSize: formData.farmSize,
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-20">
      <div className="container mx-auto px-6">
        <button
          onClick={() => onNavigate('home')}
          className="mb-8 text-primary hover:text-primary/80 flex items-center gap-2 transition-colors duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="max-w-4xl mx-auto glass rounded-3xl p-8 md:p-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Start Your AgriLog Journey
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12">
            Choose how you want to get started with AgriLog
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-card/50 rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 transform hover:scale-105 group">
              <Smartphone className="w-12 h-12 text-primary mb-4 group-hover:animate-bounce" />
              <h3 className="text-2xl font-bold mb-3 text-foreground">Mobile App</h3>
              <p className="text-muted-foreground mb-6">
                Download our mobile app for iOS and Android. Perfect for on-field logging.
              </p>
              <Button
                variant="hero"
                className="w-full"
                onClick={() => toast.info('Mobile app coming soon! We will notify you when available.')}
              >
                Download App
              </Button>
            </div>

            <div className="bg-card/50 rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 transform hover:scale-105 group">
              <Globe className="w-12 h-12 text-primary mb-4 group-hover:animate-spin" />
              <h3 className="text-2xl font-bold mb-3 text-foreground">Web Platform</h3>
              <p className="text-muted-foreground mb-6">
                Access AgriLog from any browser. Great for detailed analysis and planning.
              </p>
              <Button
                variant="hero"
                className="w-full"
                onClick={() => toast.info('Launching web platform...')}
              >
                Launch Web App
              </Button>
            </div>
          </div>

          <div className="bg-primary/10 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold mb-6 text-foreground">Sign Up Form</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full bg-card border ${
                    formErrors.name ? 'border-destructive' : 'border-border'
                  } rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-300 text-foreground placeholder:text-muted-foreground`}
                  placeholder="Enter your name"
                />
                {formErrors.name && (
                  <p className="text-destructive text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full bg-card border ${
                    formErrors.phone ? 'border-destructive' : 'border-border'
                  } rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-300 text-foreground placeholder:text-muted-foreground`}
                  placeholder="Enter your phone number"
                />
                {formErrors.phone && (
                  <p className="text-destructive text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Farm Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full bg-card border ${
                    formErrors.location ? 'border-destructive' : 'border-border'
                  } rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-300 text-foreground placeholder:text-muted-foreground`}
                  placeholder="Enter your farm location"
                />
                {formErrors.location && (
                  <p className="text-destructive text-sm mt-1">{formErrors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Farm Size (acres)</label>
                <input
                  type="number"
                  name="farmSize"
                  value={formData.farmSize}
                  onChange={handleInputChange}
                  className={`w-full bg-card border ${
                    formErrors.farmSize ? 'border-destructive' : 'border-border'
                  } rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-300 text-foreground placeholder:text-muted-foreground`}
                  placeholder="Enter farm size"
                />
                {formErrors.farmSize && (
                  <p className="text-destructive text-sm mt-1">{formErrors.farmSize}</p>
                )}
              </div>

              <Button type="submit" variant="hero" size="xl" className="w-full mt-6">
                Create Account
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
