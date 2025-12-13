-- Create institution_profiles table
CREATE TABLE public.institution_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  organization_name TEXT NOT NULL,
  institution_type TEXT NOT NULL, -- 'bank', 'insurer', 'cooperative', 'government', 'ngo'
  country_region TEXT,
  representative_name TEXT NOT NULL,
  position_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_profiles table
CREATE TABLE public.admin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role_level TEXT NOT NULL DEFAULT 'admin', -- 'super_admin', 'admin', 'support_staff'
  organization TEXT,
  admin_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create access_requests table for institution-farmer data sharing
CREATE TABLE public.access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL,
  farmer_id UUID NOT NULL,
  request_reason TEXT,
  access_type TEXT NOT NULL DEFAULT 'view', -- 'view', 'view_download', 'view_download_analytics'
  duration_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_logs table for admin tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  actor_type TEXT, -- 'farmer', 'institution', 'extension', 'admin', 'system'
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'activity', 'permission', 'access_request', 'setting'
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.institution_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Institution profiles policies
CREATE POLICY "Users can view own institution profile"
ON public.institution_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own institution profile"
ON public.institution_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own institution profile"
ON public.institution_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all institution profiles
CREATE POLICY "Admins can view all institution profiles"
ON public.institution_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin profiles policies
CREATE POLICY "Users can view own admin profile"
ON public.admin_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own admin profile"
ON public.admin_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own admin profile"
ON public.admin_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Access requests policies
CREATE POLICY "Institutions can view own requests"
ON public.access_requests FOR SELECT
USING (auth.uid() = institution_id);

CREATE POLICY "Farmers can view requests for their data"
ON public.access_requests FOR SELECT
USING (auth.uid() = farmer_id);

CREATE POLICY "Institutions can create requests"
ON public.access_requests FOR INSERT
WITH CHECK (auth.uid() = institution_id);

CREATE POLICY "Farmers can update request status"
ON public.access_requests FOR UPDATE
USING (auth.uid() = farmer_id);

CREATE POLICY "Admins can view all access requests"
ON public.access_requests FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Audit logs policies (only admins can view)
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- System settings policies (only admins)
CREATE POLICY "Admins can view system settings"
ON public.system_settings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_institution_profiles_updated_at
BEFORE UPDATE ON public.institution_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_admin_profiles_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_access_requests_updated_at
BEFORE UPDATE ON public.access_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for access_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_requests;