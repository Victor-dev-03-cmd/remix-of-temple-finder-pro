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
      chat_conversations: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      home_gallery_images: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          shipping_address: string | null
          status: string
          total_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          shipping_address?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          shipping_address?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          status: string
          stock: number
          temple_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          status?: string
          stock?: number
          temple_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          status?: string
          stock?: number
          temple_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_temple_id_fkey"
            columns: ["temple_id"]
            isOneToOne: false
            referencedRelation: "temples"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          accent_color: string
          booking_email_greeting: string | null
          booking_email_instructions: string | null
          booking_email_message: string | null
          booking_email_subject: string | null
          chat_notification_sound: boolean | null
          chat_notifications: boolean | null
          commission_rate: number | null
          compact_mode: boolean
          created_at: string
          dark_mode: boolean
          default_country: string
          display_font: string
          email_from_address: string | null
          email_from_name: string | null
          email_notifications: boolean
          footer_tagline: string | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          logo_url: string | null
          maintenance_mode: boolean
          new_order_email_message: string | null
          new_order_email_subject: string | null
          new_vendor_alerts: boolean
          order_alerts: boolean
          primary_color: string
          primary_font: string
          site_name: string
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_youtube: string | null
          updated_at: string
          vendor_approval_email_message: string | null
          vendor_approval_email_subject: string | null
          vendor_rejection_email_message: string | null
          vendor_rejection_email_subject: string | null
        }
        Insert: {
          accent_color?: string
          booking_email_greeting?: string | null
          booking_email_instructions?: string | null
          booking_email_message?: string | null
          booking_email_subject?: string | null
          chat_notification_sound?: boolean | null
          chat_notifications?: boolean | null
          commission_rate?: number | null
          compact_mode?: boolean
          created_at?: string
          dark_mode?: boolean
          default_country?: string
          display_font?: string
          email_from_address?: string | null
          email_from_name?: string | null
          email_notifications?: boolean
          footer_tagline?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          maintenance_mode?: boolean
          new_order_email_message?: string | null
          new_order_email_subject?: string | null
          new_vendor_alerts?: boolean
          order_alerts?: boolean
          primary_color?: string
          primary_font?: string
          site_name?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          updated_at?: string
          vendor_approval_email_message?: string | null
          vendor_approval_email_subject?: string | null
          vendor_rejection_email_message?: string | null
          vendor_rejection_email_subject?: string | null
        }
        Update: {
          accent_color?: string
          booking_email_greeting?: string | null
          booking_email_instructions?: string | null
          booking_email_message?: string | null
          booking_email_subject?: string | null
          chat_notification_sound?: boolean | null
          chat_notifications?: boolean | null
          commission_rate?: number | null
          compact_mode?: boolean
          created_at?: string
          dark_mode?: boolean
          default_country?: string
          display_font?: string
          email_from_address?: string | null
          email_from_name?: string | null
          email_notifications?: boolean
          footer_tagline?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          maintenance_mode?: boolean
          new_order_email_message?: string | null
          new_order_email_subject?: string | null
          new_vendor_alerts?: boolean
          order_alerts?: boolean
          primary_color?: string
          primary_font?: string
          site_name?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          updated_at?: string
          vendor_approval_email_message?: string | null
          vendor_approval_email_subject?: string | null
          vendor_rejection_email_message?: string | null
          vendor_rejection_email_subject?: string | null
        }
        Relationships: []
      }
      temple_bookings: {
        Row: {
          booking_code: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          num_tickets: number
          status: string
          temple_id: string
          ticket_details: Json | null
          updated_at: string
          visit_date: string
        }
        Insert: {
          booking_code: string
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          num_tickets?: number
          status?: string
          temple_id: string
          ticket_details?: Json | null
          updated_at?: string
          visit_date: string
        }
        Update: {
          booking_code?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          num_tickets?: number
          status?: string
          temple_id?: string
          ticket_details?: Json | null
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "temple_bookings_temple_id_fkey"
            columns: ["temple_id"]
            isOneToOne: false
            referencedRelation: "temples"
            referencedColumns: ["id"]
          },
        ]
      }
      temple_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          temple_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          temple_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          temple_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "temple_reviews_temple_id_fkey"
            columns: ["temple_id"]
            isOneToOne: false
            referencedRelation: "temples"
            referencedColumns: ["id"]
          },
        ]
      }
      temple_tickets: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          price: number
          temple_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          temple_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          temple_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "temple_tickets_temple_id_fkey"
            columns: ["temple_id"]
            isOneToOne: false
            referencedRelation: "temples"
            referencedColumns: ["id"]
          },
        ]
      }
      temples: {
        Row: {
          address: string | null
          contact: string | null
          country: string
          created_at: string
          deity: string
          description: string | null
          district: string
          id: string
          image_url: string | null
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          opening_hours: string | null
          owner_user_id: string | null
          province: string
          rating: number | null
          review_count: number | null
          services: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact?: string | null
          country?: string
          created_at?: string
          deity: string
          description?: string | null
          district: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          opening_hours?: string | null
          owner_user_id?: string | null
          province: string
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact?: string | null
          country?: string
          created_at?: string
          deity?: string
          description?: string | null
          district?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          opening_hours?: string | null
          owner_user_id?: string | null
          province?: string
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          updated_at?: string
        }
        Relationships: []
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
      vendor_applications: {
        Row: {
          admin_notes: string | null
          business_name: string
          created_at: string
          description: string | null
          id: string
          phone: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          temple_id: string | null
          temple_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          business_name: string
          created_at?: string
          description?: string | null
          id?: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          temple_id?: string | null
          temple_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          business_name?: string
          created_at?: string
          description?: string | null
          id?: string
          phone?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          temple_id?: string | null
          temple_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_applications_temple_id_fkey"
            columns: ["temple_id"]
            isOneToOne: false
            referencedRelation: "temples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_booking: {
        Args: { booking_id: string; provided_booking_code: string }
        Returns: boolean
      }
      get_booking_by_code: {
        Args: { p_booking_code: string }
        Returns: {
          booking_code: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          num_tickets: number
          status: string
          temple_id: string
          ticket_details: Json | null
          updated_at: string
          visit_date: string
        }[]
        SetofOptions: {
          from: "*"
          to: "temple_bookings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "vendor" | "customer"
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
      app_role: ["admin", "vendor", "customer"],
    },
  },
} as const
