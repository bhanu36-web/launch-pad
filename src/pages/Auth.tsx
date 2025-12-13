import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FloatingOrbs } from '@/components/FloatingOrbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  User, 
  Building, 
  ClipboardList, 
  Shield,
  Eye,
  EyeOff,
  Leaf,
  Upload
} from 'lucide-react';

type AuthMode = 'role-select' | 'signup' | 'login';
type RoleType = 'farmer' | 'institution' | 'enumerator' | 'admin';

const farmerSignupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phoneNumber: z.string().min(10, 'Enter a valid phone number').max(20),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  villageLocation: z.string().optional(),
  preferredLanguage: z.string().default('en'),
});

const extensionSignupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  organization: z.string().min(2, 'Organization is required').max(100),
  phoneNumber: z.string().min(10, 'Enter a valid phone number').max(20),
  districtRegion: z.string().min(2, 'District/Region is required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  preferredLanguage: z.string().default('en'),
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  const [mode, setMode] = useState<AuthMode>('role-select');
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    organization: '',
    phoneNumber: '',
    districtRegion: '',
    email: '',
    password: '',
    villageLocation: '',
    preferredLanguage: 'en',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const roles = [
    { id: 'farmer' as RoleType, label: 'Farmer', icon: Leaf, description: 'Record and manage your farm activities' },
    { id: 'enumerator' as RoleType, label: 'Extension Worker', icon: ClipboardList, description: 'Help farmers capture accurate records' },
    { id: 'institution' as RoleType, label: 'Institution', icon: Building, description: 'Access verified farmer data' },
    { id: 'admin' as RoleType, label: 'Admin', icon: Shield, description: 'Manage platform settings' },
  ];

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    setMode('signup');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate based on role
      if (selectedRole === 'enumerator') {
        extensionSignupSchema.parse(formData);
      } else {
        farmerSignupSchema.parse(formData);
      }
      
      if (!formData.agreeToTerms) {
        setErrors({ agreeToTerms: 'You must agree to the terms' });
        setLoading(false);
        return;
      }

      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        preferred_language: formData.preferredLanguage,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please login instead.');
          setMode('login');
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      // Insert user role
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser && selectedRole) {
        await supabase.from('user_roles').insert({
          user_id: newUser.id,
          role: selectedRole,
        });

        // Update profile with location if provided
        const updateData: Record<string, string> = {};
        if (formData.villageLocation) {
          updateData.village_location = formData.villageLocation;
        }
        if (selectedRole === 'enumerator' && formData.districtRegion) {
          updateData.village_location = formData.districtRegion;
        }
        
        if (Object.keys(updateData).length > 0) {
          await supabase.from('profiles').update(updateData).eq('user_id', newUser.id);
        }
      }

      toast.success('Signup successful!', { duration: 2000 });
      setTimeout(() => {
        setMode('login');
      }, 2000);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach(e => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = loginSchema.parse({ email: formData.email, password: formData.password });
      
      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.issues.forEach(e => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    if (selectedRole === 'enumerator') return 'Extension Worker';
    return selectedRole?.charAt(0).toUpperCase() + selectedRole?.slice(1);
  };

  const getTermsText = () => {
    if (selectedRole === 'enumerator') {
      return 'I agree to data terms & responsibilities as an extension worker';
    }
    return 'I agree to the data terms & consent. My data is private and I own my records.';
  };

  const getMicrocopy = () => {
    if (selectedRole === 'enumerator') {
      return 'You help farmers capture accurate records. Your entries are marked as verified.';
    }
    return 'We keep your data private. You own your records.';
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - AgriLog | AI Farm Management</title>
        <meta name="description" content="Create your AgriLog account and start recording your farm activities with AI-powered insights." />
      </Helmet>
      
      <div className="min-h-screen gradient-hero">
        <FloatingOrbs scrollY={0} />
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => mode === 'role-select' ? navigate('/') : setMode('role-select')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {mode === 'role-select' ? 'Back to Home' : 'Back'}
          </Button>

          <div className="max-w-md mx-auto">
            {mode === 'role-select' && (
              <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Who are you?</h1>
                <p className="text-muted-foreground text-center mb-8">Select your role to get started</p>
                
                <div className="space-y-4">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className="w-full glass rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:glow-primary group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                          <role.icon className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {role.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="text-primary hover:underline font-medium"
                    >
                      Login
                    </button>
                  </p>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
                  Create {getRoleLabel()} Account
                </h1>
                <p className="text-muted-foreground text-center mb-8">
                  {getMicrocopy()}
                </p>

                <form onSubmit={handleSignup} className="glass rounded-2xl p-6 space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                    {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName}</p>}
                  </div>

                  {/* Extension Worker specific fields */}
                  {selectedRole === 'enumerator' && (
                    <>
                      <div>
                        <Label htmlFor="organization">Organization / Affiliation *</Label>
                        <Input
                          id="organization"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          placeholder="Your organization name"
                          className="mt-1"
                        />
                        {errors.organization && <p className="text-destructive text-sm mt-1">{errors.organization}</p>}
                      </div>

                      <div>
                        <Label htmlFor="districtRegion">District / Region *</Label>
                        <Input
                          id="districtRegion"
                          name="districtRegion"
                          value={formData.districtRegion}
                          onChange={handleInputChange}
                          placeholder="Your assigned district or region"
                          className="mt-1"
                        />
                        {errors.districtRegion && <p className="text-destructive text-sm mt-1">{errors.districtRegion}</p>}
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="+254 700 000 000"
                      className="mt-1"
                    />
                    {errors.phoneNumber && <p className="text-destructive text-sm mt-1">{errors.phoneNumber}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      className="mt-1"
                    />
                    {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="At least 6 characters"
                        className="mt-1 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
                  </div>

                  {/* Farmer specific field */}
                  {selectedRole === 'farmer' && (
                    <div>
                      <Label htmlFor="villageLocation">Village / Location (optional)</Label>
                      <Input
                        id="villageLocation"
                        name="villageLocation"
                        value={formData.villageLocation}
                        onChange={handleInputChange}
                        placeholder="Your village or location"
                        className="mt-1"
                      />
                    </div>
                  )}

                  {/* Extension Worker optional upload */}
                  {selectedRole === 'enumerator' && (
                    <div>
                      <Label htmlFor="certification">Upload ID / Certification (optional)</Label>
                      <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="preferredLanguage">Preferred Language</Label>
                    <select
                      id="preferredLanguage"
                      name="preferredLanguage"
                      value={formData.preferredLanguage}
                      onChange={handleInputChange}
                      className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm text-muted-foreground">
                      {getTermsText()}
                    </Label>
                  </div>
                  {errors.agreeToTerms && <p className="text-destructive text-sm">{errors.agreeToTerms}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </form>

                <p className="text-center text-muted-foreground mt-4">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-primary hover:underline">
                    Login
                  </button>
                </p>
              </div>
            )}

            {mode === 'login' && (
              <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Welcome Back</h1>
                <p className="text-muted-foreground text-center mb-8">Login to your account</p>

                <form onSubmit={handleLogin} className="glass rounded-2xl p-6 space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      className="mt-1"
                    />
                    {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className="mt-1 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>

                <p className="text-center text-muted-foreground mt-4">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('role-select')} className="text-primary hover:underline">
                    Sign Up
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
