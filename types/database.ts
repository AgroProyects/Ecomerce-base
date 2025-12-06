// Tipos generados para Supabase Database
// Este archivo define la estructura completa de la base de datos

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
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          compare_price: number | null
          cost_price: number | null
          images: string[]
          category_id: string | null
          is_active: boolean
          is_featured: boolean
          track_inventory: boolean
          stock: number
          low_stock_threshold: number
          metadata: Json | null
          seo_title: string | null
          seo_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price: number
          compare_price?: number | null
          cost_price?: number | null
          images?: string[]
          category_id?: string | null
          is_active?: boolean
          is_featured?: boolean
          track_inventory?: boolean
          stock?: number
          low_stock_threshold?: number
          metadata?: Json | null
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price?: number
          compare_price?: number | null
          cost_price?: number | null
          images?: string[]
          category_id?: string | null
          is_active?: boolean
          is_featured?: boolean
          track_inventory?: boolean
          stock?: number
          low_stock_threshold?: number
          metadata?: Json | null
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string | null
          price_override: number | null
          stock: number
          attributes: Json
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          sku?: string | null
          price_override?: number | null
          stock?: number
          attributes?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          sku?: string | null
          price_override?: number | null
          stock?: number
          attributes?: Json
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          customer_email: string
          customer_name: string
          customer_phone: string | null
          shipping_address: Json | null
          billing_address: Json | null
          subtotal: number
          shipping_cost: number
          discount_amount: number
          total: number
          notes: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          mp_status: string | null
          mp_status_detail: string | null
          mp_payment_method: string | null
          created_at: string
          updated_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          order_number: string
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          shipping_address?: Json | null
          billing_address?: Json | null
          subtotal: number
          shipping_cost?: number
          discount_amount?: number
          total: number
          notes?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status?: string | null
          mp_status_detail?: string | null
          mp_payment_method?: string | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          shipping_address?: Json | null
          billing_address?: Json | null
          subtotal?: number
          shipping_cost?: number
          discount_amount?: number
          total?: number
          notes?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status?: string | null
          mp_status_detail?: string | null
          mp_payment_method?: string | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string | null
          product_name: string
          variant_name: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          variant_id?: string | null
          product_name: string
          variant_name?: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          variant_id?: string | null
          product_name?: string
          variant_name?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'super_admin' | 'admin' | 'editor' | 'viewer'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'super_admin' | 'admin' | 'editor' | 'viewer'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'super_admin' | 'admin' | 'editor' | 'viewer'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: string
          store_name: string
          store_slug: string
          description: string | null
          logo_url: string | null
          favicon_url: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          social_links: Json | null
          contact_email: string | null
          contact_phone: string | null
          address: Json | null
          currency: string
          currency_symbol: string
          timezone: string
          homepage_config: Json | null
          seo_config: Json | null
          shipping_config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_name: string
          store_slug: string
          description?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          social_links?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json | null
          currency?: string
          currency_symbol?: string
          timezone?: string
          homepage_config?: Json | null
          seo_config?: Json | null
          shipping_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string
          store_slug?: string
          description?: string | null
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          social_links?: Json | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: Json | null
          currency?: string
          currency_symbol?: string
          timezone?: string
          homepage_config?: Json | null
          seo_config?: Json | null
          shipping_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          id: string
          title: string | null
          subtitle: string | null
          image_url: string
          mobile_image_url: string | null
          link_url: string | null
          position: 'hero' | 'secondary' | 'footer' | 'popup'
          is_active: boolean
          sort_order: number
          starts_at: string | null
          ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          subtitle?: string | null
          image_url: string
          mobile_image_url?: string | null
          link_url?: string | null
          position?: 'hero' | 'secondary' | 'footer' | 'popup'
          is_active?: boolean
          sort_order?: number
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          subtitle?: string | null
          image_url?: string
          mobile_image_url?: string | null
          link_url?: string | null
          position?: 'hero' | 'secondary' | 'footer' | 'popup'
          is_active?: boolean
          sort_order?: number
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      decrement_product_stock: {
        Args: {
          p_product_id: string
          p_quantity: number
        }
        Returns: void
      }
      decrement_variant_stock: {
        Args: {
          p_variant_id: string
          p_quantity: number
        }
        Returns: void
      }
    }
    Enums: {
      order_status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
      user_role: 'super_admin' | 'admin' | 'editor' | 'viewer'
      banner_position: 'hero' | 'secondary' | 'footer' | 'popup'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenient aliases
export type Category = Tables<'categories'>
export type Product = Tables<'products'>
export type ProductVariant = Tables<'product_variants'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type User = Tables<'users'>
export type StoreSettings = Tables<'store_settings'>
export type Banner = Tables<'banners'>
