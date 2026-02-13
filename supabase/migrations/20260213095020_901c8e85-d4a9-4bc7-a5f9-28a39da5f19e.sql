
-- ============================================
-- EMAIL MARKETING PLATFORM - PHASE 1 SCHEMA
-- ============================================

-- SMTP Configuration (cPanel primary, Resend fallback)
CREATE TABLE public.email_smtp_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'cpanel', -- 'cpanel' or 'resend'
  host TEXT,
  port INTEGER DEFAULT 465,
  username TEXT,
  password TEXT,
  encryption TEXT DEFAULT 'ssl', -- 'ssl', 'tls', 'none'
  from_email TEXT NOT NULL,
  from_name TEXT,
  api_key TEXT, -- for Resend
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 500,
  hourly_limit INTEGER DEFAULT 100,
  emails_sent_today INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact Lists / Audiences
CREATE TABLE public.email_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contacts
CREATE TABLE public.email_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'subscribed', -- subscribed, unsubscribed, bounced, complained
  source TEXT DEFAULT 'manual', -- manual, form, import, api
  custom_fields JSONB DEFAULT '{}',
  last_emailed_at TIMESTAMP WITH TIME ZONE,
  total_emails_sent INTEGER DEFAULT 0,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, email)
);

-- List Members (many-to-many)
CREATE TABLE public.email_list_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.email_contacts(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- active, unsubscribed
  UNIQUE(list_id, contact_id)
);

-- Tags
CREATE TABLE public.email_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, name)
);

-- Contact Tags (many-to-many)
CREATE TABLE public.email_contact_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.email_contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.email_tags(id) ON DELETE CASCADE,
  UNIQUE(contact_id, tag_id)
);

-- Email Templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  html_content TEXT,
  json_content JSONB, -- for drag-and-drop builder state
  text_content TEXT,
  category TEXT DEFAULT 'custom', -- custom, transactional, marketing, welcome, cart
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaigns
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  from_email TEXT,
  from_name TEXT,
  html_content TEXT,
  text_content TEXT,
  template_id UUID REFERENCES public.email_templates(id),
  list_id UUID REFERENCES public.email_lists(id),
  smtp_config_id UUID REFERENCES public.email_smtp_configs(id),
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent, paused, failed
  campaign_type TEXT DEFAULT 'regular', -- regular, ab_test, automated, transactional
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_bounces INTEGER DEFAULT 0,
  total_unsubscribes INTEGER DEFAULT 0,
  total_complaints INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}', -- track_opens, track_clicks, etc
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign Recipients (individual send tracking)
CREATE TABLE public.email_campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.email_contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, queued, sent, delivered, opened, clicked, bounced, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  UNIQUE(campaign_id, contact_id)
);

-- Email Send Queue (for rate limiting)
CREATE TABLE public.email_send_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.email_campaign_recipients(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  smtp_config_id UUID REFERENCES public.email_smtp_configs(id),
  priority INTEGER DEFAULT 5, -- 1=highest (transactional), 5=normal (marketing)
  status TEXT DEFAULT 'queued', -- queued, processing, sent, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.email_smtp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies - SMTP Configs
CREATE POLICY "Users can manage own SMTP configs" ON public.email_smtp_configs FOR ALL USING (profile_id = get_profile_id());

-- RLS Policies - Lists
CREATE POLICY "Users can manage own lists" ON public.email_lists FOR ALL USING (profile_id = get_profile_id());

-- RLS Policies - Contacts
CREATE POLICY "Users can manage own contacts" ON public.email_contacts FOR ALL USING (profile_id = get_profile_id());

-- RLS Policies - List Members
CREATE POLICY "Users can manage list members" ON public.email_list_members FOR ALL 
USING (list_id IN (SELECT id FROM public.email_lists WHERE profile_id = get_profile_id()));

-- RLS Policies - Tags
CREATE POLICY "Users can manage own tags" ON public.email_tags FOR ALL USING (profile_id = get_profile_id());

-- RLS Policies - Contact Tags
CREATE POLICY "Users can manage contact tags" ON public.email_contact_tags FOR ALL 
USING (contact_id IN (SELECT id FROM public.email_contacts WHERE profile_id = get_profile_id()));

-- RLS Policies - Templates
CREATE POLICY "Users can manage own templates" ON public.email_templates FOR ALL USING (profile_id = get_profile_id());
CREATE POLICY "Users can view public templates" ON public.email_templates FOR SELECT USING (is_public = true);

-- RLS Policies - Campaigns
CREATE POLICY "Users can manage own campaigns" ON public.email_campaigns FOR ALL USING (profile_id = get_profile_id());

-- RLS Policies - Campaign Recipients
CREATE POLICY "Users can manage campaign recipients" ON public.email_campaign_recipients FOR ALL 
USING (campaign_id IN (SELECT id FROM public.email_campaigns WHERE profile_id = get_profile_id()));

-- RLS Policies - Send Queue
CREATE POLICY "Users can view own queue" ON public.email_send_queue FOR ALL 
USING (campaign_id IN (SELECT id FROM public.email_campaigns WHERE profile_id = get_profile_id()));

-- Admin policies
CREATE POLICY "Admins can manage all SMTP configs" ON public.email_smtp_configs FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all lists" ON public.email_lists FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all contacts" ON public.email_contacts FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all list members" ON public.email_list_members FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all tags" ON public.email_tags FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all contact tags" ON public.email_contact_tags FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all templates" ON public.email_templates FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all campaigns" ON public.email_campaigns FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all recipients" ON public.email_campaign_recipients FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all queue" ON public.email_send_queue FOR ALL USING (is_admin());

-- Indexes for performance
CREATE INDEX idx_email_contacts_profile ON public.email_contacts(profile_id);
CREATE INDEX idx_email_contacts_email ON public.email_contacts(email);
CREATE INDEX idx_email_contacts_status ON public.email_contacts(status);
CREATE INDEX idx_email_campaigns_profile ON public.email_campaigns(profile_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_send_queue_status ON public.email_send_queue(status, scheduled_for);
CREATE INDEX idx_email_campaign_recipients_status ON public.email_campaign_recipients(campaign_id, status);
CREATE INDEX idx_email_list_members_list ON public.email_list_members(list_id);

-- Update triggers
CREATE TRIGGER update_email_smtp_configs_updated_at BEFORE UPDATE ON public.email_smtp_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_lists_updated_at BEFORE UPDATE ON public.email_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_contacts_updated_at BEFORE UPDATE ON public.email_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update list subscriber count
CREATE OR REPLACE FUNCTION public.update_list_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.email_lists SET subscriber_count = (
      SELECT COUNT(*) FROM public.email_list_members WHERE list_id = NEW.list_id AND status = 'active'
    ) WHERE id = NEW.list_id;
  END IF;
  IF TG_OP = 'DELETE' THEN
    UPDATE public.email_lists SET subscriber_count = (
      SELECT COUNT(*) FROM public.email_list_members WHERE list_id = OLD.list_id AND status = 'active'
    ) WHERE id = OLD.list_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_subscriber_count
AFTER INSERT OR UPDATE OR DELETE ON public.email_list_members
FOR EACH ROW EXECUTE FUNCTION public.update_list_subscriber_count();
