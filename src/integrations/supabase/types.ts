export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agency_clients: {
        Row: {
          agency_profile_id: string
          brand_color: string | null
          client_email: string | null
          client_name: string
          created_at: string
          custom_domain: string | null
          id: string
          logo_url: string | null
          status: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          agency_profile_id: string
          brand_color?: string | null
          client_email?: string | null
          client_name: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          agency_profile_id?: string
          brand_color?: string | null
          client_email?: string | null
          client_name?: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      agency_reports: {
        Row: {
          agency_profile_id: string
          client_id: string | null
          created_at: string
          date_from: string | null
          date_to: string | null
          generated_at: string
          id: string
          report_data: Json
          report_type: string
        }
        Insert: {
          agency_profile_id: string
          client_id?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          generated_at?: string
          id?: string
          report_data?: Json
          report_type?: string
        }
        Update: {
          agency_profile_id?: string
          client_id?: string | null
          created_at?: string
          date_from?: string | null
          date_to?: string | null
          generated_at?: string
          id?: string
          report_data?: Json
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "agency_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json
          profile_id: string
          rate_limit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json
          profile_id: string
          rate_limit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          profile_id?: string
          rate_limit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key_id: string
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          response_time_ms: number | null
          status_code: number
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code: number
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          settings: Json
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          settings?: Json
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          settings?: Json
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          profile_id: string
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          profile_id: string
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          profile_id?: string
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_variants: {
        Row: {
          campaign_id: string
          created_at: string
          html_content: string | null
          id: string
          is_winner: boolean
          subject: string | null
          total_bounces: number
          total_clicks: number
          total_opens: number
          total_sent: number
          updated_at: string
          variant_label: string
          weight: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          html_content?: string | null
          id?: string
          is_winner?: boolean
          subject?: string | null
          total_bounces?: number
          total_clicks?: number
          total_opens?: number
          total_sent?: number
          updated_at?: string
          variant_label?: string
          weight?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          html_content?: string | null
          id?: string
          is_winner?: boolean
          subject?: string | null
          total_bounces?: number
          total_clicks?: number
          total_opens?: number
          total_sent?: number
          updated_at?: string
          variant_label?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automation_steps: {
        Row: {
          automation_id: string
          branch_label: string | null
          config: Json
          created_at: string
          id: string
          parent_step_id: string | null
          step_order: number
          step_type: string
          updated_at: string
        }
        Insert: {
          automation_id: string
          branch_label?: string | null
          config?: Json
          created_at?: string
          id?: string
          parent_step_id?: string | null
          step_order?: number
          step_type: string
          updated_at?: string
        }
        Update: {
          automation_id?: string
          branch_label?: string | null
          config?: Json
          created_at?: string
          id?: string
          parent_step_id?: string | null
          step_order?: number
          step_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_automation_steps_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_automation_steps_parent_step_id_fkey"
            columns: ["parent_step_id"]
            isOneToOne: false
            referencedRelation: "email_automation_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          profile_id: string
          stats: Json
          status: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          profile_id: string
          stats?: Json
          status?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          profile_id?: string
          stats?: Json
          status?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_automations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_recipients: {
        Row: {
          bounced_at: string | null
          campaign_id: string
          click_count: number | null
          clicked_at: string | null
          contact_id: string
          error_message: string | null
          id: string
          open_count: number | null
          opened_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          bounced_at?: string | null
          campaign_id: string
          click_count?: number | null
          clicked_at?: string | null
          contact_id: string
          error_message?: string | null
          id?: string
          open_count?: number | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string
          click_count?: number | null
          clicked_at?: string | null
          contact_id?: string
          error_message?: string | null
          id?: string
          open_count?: number | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "email_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          ab_test_duration_hours: number | null
          ab_test_metric: string | null
          ab_test_sample_percent: number | null
          ab_winner_selected_at: string | null
          campaign_type: string | null
          completed_at: string | null
          created_at: string
          from_email: string | null
          from_name: string | null
          html_content: string | null
          id: string
          is_ab_test: boolean
          list_id: string | null
          name: string
          profile_id: string
          scheduled_at: string | null
          sent_at: string | null
          settings: Json | null
          smtp_config_id: string | null
          status: string
          subject: string | null
          template_id: string | null
          text_content: string | null
          total_bounces: number | null
          total_clicks: number | null
          total_complaints: number | null
          total_delivered: number | null
          total_opens: number | null
          total_recipients: number | null
          total_sent: number | null
          total_unsubscribes: number | null
          updated_at: string
        }
        Insert: {
          ab_test_duration_hours?: number | null
          ab_test_metric?: string | null
          ab_test_sample_percent?: number | null
          ab_winner_selected_at?: string | null
          campaign_type?: string | null
          completed_at?: string | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          html_content?: string | null
          id?: string
          is_ab_test?: boolean
          list_id?: string | null
          name: string
          profile_id: string
          scheduled_at?: string | null
          sent_at?: string | null
          settings?: Json | null
          smtp_config_id?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          text_content?: string | null
          total_bounces?: number | null
          total_clicks?: number | null
          total_complaints?: number | null
          total_delivered?: number | null
          total_opens?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          total_unsubscribes?: number | null
          updated_at?: string
        }
        Update: {
          ab_test_duration_hours?: number | null
          ab_test_metric?: string | null
          ab_test_sample_percent?: number | null
          ab_winner_selected_at?: string | null
          campaign_type?: string | null
          completed_at?: string | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          html_content?: string | null
          id?: string
          is_ab_test?: boolean
          list_id?: string | null
          name?: string
          profile_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          settings?: Json | null
          smtp_config_id?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          text_content?: string | null
          total_bounces?: number | null
          total_clicks?: number | null
          total_complaints?: number | null
          total_delivered?: number | null
          total_opens?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          total_unsubscribes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_smtp_config_id_fkey"
            columns: ["smtp_config_id"]
            isOneToOne: false
            referencedRelation: "email_smtp_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_contact_tags: {
        Row: {
          contact_id: string
          id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          id?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "email_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "email_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      email_contacts: {
        Row: {
          company: string | null
          created_at: string
          custom_fields: Json | null
          email: string
          first_name: string | null
          id: string
          last_emailed_at: string | null
          last_name: string | null
          phone: string | null
          profile_id: string
          source: string | null
          status: string
          total_clicks: number | null
          total_emails_sent: number | null
          total_opens: number | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email: string
          first_name?: string | null
          id?: string
          last_emailed_at?: string | null
          last_name?: string | null
          phone?: string | null
          profile_id: string
          source?: string | null
          status?: string
          total_clicks?: number | null
          total_emails_sent?: number | null
          total_opens?: number | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string
          first_name?: string | null
          id?: string
          last_emailed_at?: string | null
          last_name?: string | null
          phone?: string | null
          profile_id?: string
          source?: string | null
          status?: string
          total_clicks?: number | null
          total_emails_sent?: number | null
          total_opens?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_list_members: {
        Row: {
          contact_id: string
          id: string
          list_id: string
          status: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          contact_id: string
          id?: string
          list_id: string
          status?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          contact_id?: string
          id?: string
          list_id?: string
          status?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_list_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "email_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      email_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          profile_id: string
          subscriber_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          profile_id: string
          subscriber_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          profile_id?: string
          subscriber_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_lists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_queue: {
        Row: {
          attempts: number | null
          campaign_id: string | null
          contact_email: string
          created_at: string
          error_message: string | null
          from_email: string
          from_name: string | null
          html_content: string
          id: string
          max_attempts: number | null
          priority: number | null
          processed_at: string | null
          recipient_id: string | null
          scheduled_for: string | null
          smtp_config_id: string | null
          status: string | null
          subject: string
          text_content: string | null
        }
        Insert: {
          attempts?: number | null
          campaign_id?: string | null
          contact_email: string
          created_at?: string
          error_message?: string | null
          from_email: string
          from_name?: string | null
          html_content: string
          id?: string
          max_attempts?: number | null
          priority?: number | null
          processed_at?: string | null
          recipient_id?: string | null
          scheduled_for?: string | null
          smtp_config_id?: string | null
          status?: string | null
          subject: string
          text_content?: string | null
        }
        Update: {
          attempts?: number | null
          campaign_id?: string | null
          contact_email?: string
          created_at?: string
          error_message?: string | null
          from_email?: string
          from_name?: string | null
          html_content?: string
          id?: string
          max_attempts?: number | null
          priority?: number | null
          processed_at?: string | null
          recipient_id?: string | null
          scheduled_for?: string | null
          smtp_config_id?: string | null
          status?: string | null
          subject?: string
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_send_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_send_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_send_queue_smtp_config_id_fkey"
            columns: ["smtp_config_id"]
            isOneToOne: false
            referencedRelation: "email_smtp_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_smtp_configs: {
        Row: {
          api_key: string | null
          created_at: string
          daily_limit: number | null
          emails_sent_today: number | null
          encryption: string | null
          from_email: string
          from_name: string | null
          host: string | null
          hourly_limit: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_reset_at: string | null
          name: string
          password: string | null
          port: number | null
          profile_id: string
          provider: string
          updated_at: string
          username: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          daily_limit?: number | null
          emails_sent_today?: number | null
          encryption?: string | null
          from_email: string
          from_name?: string | null
          host?: string | null
          hourly_limit?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_reset_at?: string | null
          name: string
          password?: string | null
          port?: number | null
          profile_id: string
          provider?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string
          daily_limit?: number | null
          emails_sent_today?: number | null
          encryption?: string | null
          from_email?: string
          from_name?: string | null
          host?: string | null
          hourly_limit?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_reset_at?: string | null
          name?: string
          password?: string | null
          port?: number | null
          profile_id?: string
          provider?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_smtp_configs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          profile_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          profile_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          created_at: string
          html_content: string | null
          id: string
          is_public: boolean | null
          json_content: Json | null
          name: string
          profile_id: string
          subject: string | null
          text_content: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          html_content?: string | null
          id?: string
          is_public?: boolean | null
          json_content?: Json | null
          name: string
          profile_id: string
          subject?: string | null
          text_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          html_content?: string | null
          id?: string
          is_public?: boolean | null
          json_content?: Json | null
          name?: string
          profile_id?: string
          subject?: string | null
          text_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component_stack: string | null
          created_at: string
          error_message: string
          error_stack: string | null
          id: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          error_message: string
          error_stack?: string | null
          id?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          error_message?: string
          error_stack?: string | null
          id?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      executions: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          input_data: Json | null
          logs: Json | null
          output_data: Json | null
          started_at: string
          status: string
          triggered_by: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_data?: Json | null
          logs?: Json | null
          output_data?: Json | null
          started_at?: string
          status: string
          triggered_by?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          input_data?: Json | null
          logs?: Json | null
          output_data?: Json | null
          started_at?: string
          status?: string
          triggered_by?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "executions_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_store_collections: {
        Row: {
          created_at: string
          default_ttl_seconds: number | null
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_ttl_seconds?: number | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_ttl_seconds?: number | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nexus_store_documents: {
        Row: {
          collection_id: string
          created_at: string
          data: Json
          id: string
          ttl_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          data?: Json
          id?: string
          ttl_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          data?: Json
          id?: string
          ttl_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_store_documents_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "nexus_store_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      node_plugins: {
        Row: {
          category: string
          config_schema: Json
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          updated_at: string
          version: string
        }
        Insert: {
          category: string
          config_schema?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          updated_at?: string
          version?: string
        }
        Update: {
          category?: string
          config_schema?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_plugins_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          gateway_transaction_id: string | null
          id: string
          metadata: Json | null
          payment_gateway: Database["public"]["Enums"]["payment_gateway"]
          payment_method: string | null
          profile_id: string
          status: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          gateway_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway: Database["public"]["Enums"]["payment_gateway"]
          payment_method?: string | null
          profile_id: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          gateway_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: Database["public"]["Enums"]["payment_gateway"]
          payment_method?: string | null
          profile_id?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          price_monthly: number
          price_yearly: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          id: string
          metadata: Json | null
          payment_gateway: Database["public"]["Enums"]["payment_gateway"] | null
          plan_id: string
          profile_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?:
            | Database["public"]["Enums"]["payment_gateway"]
            | null
          plan_id: string
          profile_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?:
            | Database["public"]["Enums"]["payment_gateway"]
            | null
          plan_id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_alert_rules: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          id: string
          last_triggered_at: string | null
          metric: string
          operator: string
          threshold: number
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          metric: string
          operator?: string
          threshold: number
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          last_triggered_at?: string | null
          metric?: string
          operator?: string
          threshold?: number
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      tracking_alerts: {
        Row: {
          condition: Json
          created_at: string
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          notify_email: string | null
          user_id: string
        }
        Insert: {
          condition?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          notify_email?: string | null
          user_id: string
        }
        Update: {
          condition?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          notify_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tracking_dashboards: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      tracking_destinations: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          retry_config: Json | null
          type: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          retry_config?: Json | null
          type: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          retry_config?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          created_at: string
          destination: string | null
          event_fingerprint: string | null
          event_name: string
          id: string
          payload: Json
          pipeline_id: string | null
          response: Json | null
          retry_count: number
          source: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination?: string | null
          event_fingerprint?: string | null
          event_name: string
          id?: string
          payload?: Json
          pipeline_id?: string | null
          response?: Json | null
          retry_count?: number
          source: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string | null
          event_fingerprint?: string | null
          event_name?: string
          id?: string
          payload?: Json
          pipeline_id?: string | null
          response?: Json | null
          retry_count?: number
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "tracking_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_identity_config: {
        Row: {
          ad_blocker_bypass: boolean | null
          bot_action: string
          bot_threshold: number
          click_id_recovery: Json
          cookie_ttl_days: number
          created_at: string
          cross_domains: string[] | null
          custom_domain: string | null
          hashing_algorithm: string
          id: string
          seo_crawler_allowlist: string[] | null
          updated_at: string
          user_id: string
          user_id_salt: string | null
        }
        Insert: {
          ad_blocker_bypass?: boolean | null
          bot_action?: string
          bot_threshold?: number
          click_id_recovery?: Json
          cookie_ttl_days?: number
          created_at?: string
          cross_domains?: string[] | null
          custom_domain?: string | null
          hashing_algorithm?: string
          id?: string
          seo_crawler_allowlist?: string[] | null
          updated_at?: string
          user_id: string
          user_id_salt?: string | null
        }
        Update: {
          ad_blocker_bypass?: boolean | null
          bot_action?: string
          bot_threshold?: number
          click_id_recovery?: Json
          cookie_ttl_days?: number
          created_at?: string
          cross_domains?: string[] | null
          custom_domain?: string | null
          hashing_algorithm?: string
          id?: string
          seo_crawler_allowlist?: string[] | null
          updated_at?: string
          user_id?: string
          user_id_salt?: string | null
        }
        Relationships: []
      }
      tracking_pipelines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          pipeline_data: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pipeline_data?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pipeline_data?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_privacy_settings: {
        Row: {
          anonymizer_rules: Json
          cmp_config: Json | null
          cmp_provider: string | null
          consent_mode: Json
          created_at: string
          data_residency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anonymizer_rules?: Json
          cmp_config?: Json | null
          cmp_provider?: string | null
          consent_mode?: Json
          created_at?: string
          data_residency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anonymizer_rules?: Json
          cmp_config?: Json | null
          cmp_provider?: string | null
          consent_mode?: Json
          created_at?: string
          data_residency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_product_feeds: {
        Row: {
          cost_price: number
          created_at: string
          currency: string
          id: string
          product_name: string | null
          sell_price: number
          sku: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          currency?: string
          id?: string
          product_name?: string | null
          sell_price?: number
          sku: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          currency?: string
          id?: string
          product_name?: string | null
          sell_price?: number
          sku?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_tokens_used: number
          created_at: string
          executions_count: number
          id: string
          period_end: string
          period_start: string
          profile_id: string
          storage_bytes_used: number
          updated_at: string
        }
        Insert: {
          ai_tokens_used?: number
          created_at?: string
          executions_count?: number
          id?: string
          period_end: string
          period_start: string
          profile_id: string
          storage_bytes_used?: number
          updated_at?: string
        }
        Update: {
          ai_tokens_used?: number
          created_at?: string
          executions_count?: number
          id?: string
          period_end?: string
          period_start?: string
          profile_id?: string
          storage_bytes_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          profile_id: string
          total_purchased: number
          total_used: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          profile_id: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          profile_id?: string
          total_purchased?: number
          total_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plugin_installs: {
        Row: {
          id: string
          installed_at: string
          plugin_id: string
          profile_id: string
        }
        Insert: {
          id?: string
          installed_at?: string
          plugin_id: string
          profile_id: string
        }
        Update: {
          id?: string
          installed_at?: string
          plugin_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plugin_installs_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "node_plugins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plugin_installs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          cron_expression: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cron_expression?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cron_expression?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_schedules_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: true
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_shares: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          profile_id: string
          role: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          profile_id: string
          role: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          profile_id?: string
          role?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_shares_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_shares_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_shares_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string
          created_at: string
          data: Json
          description: string | null
          id: string
          is_featured: boolean
          name: string
          thumbnail_url: string | null
          use_count: number
        }
        Insert: {
          category: string
          created_at?: string
          data: Json
          description?: string | null
          id?: string
          is_featured?: boolean
          name: string
          thumbnail_url?: string | null
          use_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          is_featured?: boolean
          name?: string
          thumbnail_url?: string | null
          use_count?: number
        }
        Relationships: []
      }
      workflow_versions: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          description: string | null
          id: string
          version_number: number
          workflow_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data: Json
          description?: string | null
          id?: string
          version_number: number
          workflow_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          description?: string | null
          id?: string
          version_number?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_versions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          description: string | null
          id: string
          is_active: boolean
          name: string
          tags: string[] | null
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          tags?: string[] | null
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tags?: string[] | null
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          role: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          role: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_profile_id: string
          p_type?: string
        }
        Returns: {
          balance: number
          created_at: string
          id: string
          profile_id: string
          total_purchased: number
          total_used: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "user_credits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_edit_workflow: {
        Args: { p_profile_id: string; p_workflow_id: string }
        Returns: boolean
      }
      deduct_credits: {
        Args: { p_amount: number; p_description?: string; p_profile_id: string }
        Returns: {
          balance: number
          created_at: string
          id: string
          profile_id: string
          total_purchased: number
          total_used: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "user_credits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_profile_id: { Args: never; Returns: string }
      get_workspace_role: {
        Args: { p_profile_id: string; p_workspace_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_campaign_clicks: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      increment_campaign_opens: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_workspace_member: {
        Args: { p_profile_id: string; p_workspace_id: string }
        Returns: boolean
      }
      log_api_usage: {
        Args: {
          p_api_key_id: string
          p_endpoint: string
          p_ip_address?: string
          p_method: string
          p_request_body?: Json
          p_response_time_ms?: number
          p_status_code: number
          p_user_agent?: string
        }
        Returns: undefined
      }
      validate_api_key: {
        Args: { p_key_hash: string; p_key_prefix: string }
        Returns: {
          api_key_id: string
          permissions: Json
          profile_id: string
          rate_limit: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      payment_gateway: "sslcommerz" | "bkash" | "nagad" | "stripe" | "manual"
      subscription_status:
        | "active"
        | "trial"
        | "canceled"
        | "past_due"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      payment_gateway: ["sslcommerz", "bkash", "nagad", "stripe", "manual"],
      subscription_status: [
        "active",
        "trial",
        "canceled",
        "past_due",
        "paused",
      ],
    },
  },
} as const
