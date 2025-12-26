export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          id: string
          guest_id: string
          question_id: string
          value: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guest_id: string
          question_id: string
          value: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guest_id?: string
          question_id?: string
          value?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          created_at: string | null
          end_time: string | null
          event_id: string
          id: string
          name: string
          order_index: number | null
          start_time: string | null
          location: string | null
          attendance_required: boolean | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          event_id: string
          id?: string
          name: string
          order_index?: number | null
          start_time?: string | null
          location?: string | null
          attendance_required?: boolean | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          event_id?: string
          id?: string
          name?: string
          order_index?: number | null
          start_time?: string | null
          location?: string | null
          attendance_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoints: {
        Row: {
          created_at: string | null
          event_id: string
          executed: boolean | null
          id: string
          message: string | null
          trigger_at: string
          type: string | null
          name: string | null
          required_question_ids: string[] | null
          applicable_block_ids: string[] | null
          auto_resolve_to: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          executed?: boolean | null
          id?: string
          message?: string | null
          trigger_at: string
          type?: string | null
          name?: string | null
          required_question_ids?: string[] | null
          applicable_block_ids?: string[] | null
          auto_resolve_to?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          executed?: boolean | null
          id?: string
          message?: string | null
          trigger_at?: string
          type?: string | null
          name?: string | null
          required_question_ids?: string[] | null
          applicable_block_ids?: string[] | null
          auto_resolve_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          organiser_id: string | null
          settings: Json | null
          start_date: string | null
          status: string | null
          timezone: string | null
          title: string
          updated_at: string | null
          template: string | null
          place_id: string | null
          place_data: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          organiser_id?: string | null
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          timezone?: string | null
          title: string
          updated_at?: string | null
          template?: string | null
          place_id?: string | null
          place_data?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          organiser_id?: string | null
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
          template?: string | null
          place_id?: string | null
          place_data?: Json | null
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string | null
          email: string | null
          event_id: string
          id: string
          magic_token: string | null
          name: string
          phone: string | null
          status: string | null
          opted_out_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          event_id: string
          id?: string
          magic_token?: string | null
          name: string
          phone?: string | null
          status?: string | null
          opted_out_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          event_id?: string
          id?: string
          magic_token?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          opted_out_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      nudges: {
        Row: {
          channel: string
          checkpoint_id: string | null
          created_at: string | null
          guest_id: string | null
          id: string
          sent_at: string | null
          status: string | null
          message: string | null
          idempotency_key: string | null
          external_id: string | null
          delivered_at: string | null
          error_message: string | null
        }
        Insert: {
          channel: string
          checkpoint_id?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          message?: string | null
          idempotency_key?: string | null
          external_id?: string | null
          delivered_at?: string | null
          error_message?: string | null
        }
        Update: {
          channel?: string
          checkpoint_id?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          message?: string | null
          idempotency_key?: string | null
          external_id?: string | null
          delivered_at?: string | null
          error_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nudges_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudges_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          options: Json | null
          order_index: number | null
          prompt: string
          required: boolean | null
          type: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          options?: Json | null
          order_index?: number | null
          prompt: string
          required?: boolean | null
          type: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          options?: Json | null
          order_index?: number | null
          prompt?: string
          required?: boolean | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          arrival_time: string | null
          block_id: string
          created_at: string | null
          departure_time: string | null
          guest_id: string
          id: string
          response: string
          updated_at: string | null
        }
        Insert: {
          arrival_time?: string | null
          block_id: string
          created_at?: string | null
          departure_time?: string | null
          guest_id: string
          id?: string
          response: string
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string | null
          block_id?: string
          created_at?: string | null
          departure_time?: string | null
          guest_id?: string
          id?: string
          response?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: string | null
          status: string | null
          current_period_end: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: string | null
          status?: string | null
          current_period_end?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: string | null
          status?: string | null
          current_period_end?: string | null
          created_at?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
