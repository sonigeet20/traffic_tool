export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          target_url: string
          status: 'draft' | 'active' | 'paused' | 'completed'
          total_sessions: number
          concurrent_bots: number
          session_duration_min: number
          session_duration_max: number
          target_geo_locations: string[]
          use_residential_proxies: boolean
          proxy_provider: string
          proxy_username: string | null
          proxy_password: string | null
          proxy_host: string | null
          proxy_port: string | null
          total_users: number
          distribution_period_hours: number
          distribution_pattern: 'uniform' | 'spike' | 'gradual_increase' | 'random'
          sessions_per_hour: number
          traffic_source_distribution: { direct: number; search: number }
          search_keywords: string[]
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_url: string
          status?: 'draft' | 'active' | 'paused' | 'completed'
          total_sessions?: number
          concurrent_bots?: number
          session_duration_min?: number
          session_duration_max?: number
          target_geo_locations?: string[]
          use_residential_proxies?: boolean
          proxy_provider?: string
          proxy_username?: string | null
          proxy_password?: string | null
          proxy_host?: string | null
          proxy_port?: string | null
          total_users?: number
          distribution_period_hours?: number
          distribution_pattern?: 'uniform' | 'spike' | 'gradual_increase' | 'random'
          sessions_per_hour?: number
          traffic_source_distribution?: { direct: number; search: number }
          search_keywords?: string[]
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_url?: string
          status?: 'draft' | 'active' | 'paused' | 'completed'
          total_sessions?: number
          concurrent_bots?: number
          session_duration_min?: number
          session_duration_max?: number
          target_geo_locations?: string[]
          use_residential_proxies?: boolean
          proxy_provider?: string
          proxy_username?: string | null
          proxy_password?: string | null
          proxy_host?: string | null
          proxy_port?: string | null
          total_users?: number
          distribution_period_hours?: number
          distribution_pattern?: 'uniform' | 'spike' | 'gradual_increase' | 'random'
          sessions_per_hour?: number
          traffic_source_distribution?: { direct: number; search: number }
          search_keywords?: string[]
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
      user_journeys: {
        Row: {
          id: string
          campaign_id: string
          step_order: number
          action_type: 'navigate' | 'click' | 'scroll' | 'wait' | 'fill_form' | 'hover' | 'screenshot'
          selector: string | null
          value: string | null
          wait_before: number
          wait_after: number
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          step_order: number
          action_type: 'navigate' | 'click' | 'scroll' | 'wait' | 'fill_form' | 'hover' | 'screenshot'
          selector?: string | null
          value?: string | null
          wait_before?: number
          wait_after?: number
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          step_order?: number
          action_type?: 'navigate' | 'click' | 'scroll' | 'wait' | 'fill_form' | 'hover' | 'screenshot'
          selector?: string | null
          value?: string | null
          wait_before?: number
          wait_after?: number
          created_at?: string
        }
      }
      bot_sessions: {
        Row: {
          id: string
          campaign_id: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          user_agent: string | null
          viewport_width: number
          viewport_height: number
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          user_agent?: string | null
          viewport_width?: number
          viewport_height?: number
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          user_agent?: string | null
          viewport_width?: number
          viewport_height?: number
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      session_activities: {
        Row: {
          id: string
          session_id: string
          journey_step_id: string | null
          action_type: string
          element_selector: string | null
          success: boolean
          duration_ms: number | null
          screenshot_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          journey_step_id?: string | null
          action_type: string
          element_selector?: string | null
          success?: boolean
          duration_ms?: number | null
          screenshot_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          journey_step_id?: string | null
          action_type?: string
          element_selector?: string | null
          success?: boolean
          duration_ms?: number | null
          screenshot_url?: string | null
          created_at?: string
        }
      }
      performance_metrics: {
        Row: {
          id: string
          session_id: string
          url: string
          load_time_ms: number | null
          dom_ready_ms: number | null
          first_paint_ms: number | null
          first_contentful_paint_ms: number | null
          time_to_interactive_ms: number | null
          total_requests: number | null
          total_size_kb: number | null
          memory_used_mb: number | null
          cpu_usage_percent: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          url: string
          load_time_ms?: number | null
          dom_ready_ms?: number | null
          first_paint_ms?: number | null
          first_contentful_paint_ms?: number | null
          time_to_interactive_ms?: number | null
          total_requests?: number | null
          total_size_kb?: number | null
          memory_used_mb?: number | null
          cpu_usage_percent?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          url?: string
          load_time_ms?: number | null
          dom_ready_ms?: number | null
          first_paint_ms?: number | null
          first_contentful_paint_ms?: number | null
          time_to_interactive_ms?: number | null
          total_requests?: number | null
          total_size_kb?: number | null
          memory_used_mb?: number | null
          cpu_usage_percent?: number | null
          created_at?: string
        }
      }
      browser_plugins: {
        Row: {
          id: string
          campaign_id: string
          name: string
          extension_id: string | null
          enabled: boolean
          configuration: Json
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          name: string
          extension_id?: string | null
          enabled?: boolean
          configuration?: Json
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          name?: string
          extension_id?: string | null
          enabled?: boolean
          configuration?: Json
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          session_id: string
          event_type: 'pageview' | 'click' | 'conversion' | 'error' | 'custom'
          event_category: string | null
          event_action: string | null
          event_label: string | null
          event_value: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          event_type: 'pageview' | 'click' | 'conversion' | 'error' | 'custom'
          event_category?: string | null
          event_action?: string | null
          event_label?: string | null
          event_value?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          event_type?: 'pageview' | 'click' | 'conversion' | 'error' | 'custom'
          event_category?: string | null
          event_action?: string | null
          event_label?: string | null
          event_value?: number | null
          metadata?: Json
          created_at?: string
        }
      }
      google_analytics_config: {
        Row: {
          id: string
          user_id: string
          property_id: string | null
          measurement_id: string | null
          api_secret: string | null
          service_account_key: Json | null
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id?: string | null
          measurement_id?: string | null
          api_secret?: string | null
          service_account_key?: Json | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string | null
          measurement_id?: string | null
          api_secret?: string | null
          service_account_key?: Json | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
