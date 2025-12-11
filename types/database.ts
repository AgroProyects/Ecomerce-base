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
          status: 'pending' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
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
          admin_notes: string | null
          coupon_id: string | null
          coupon_code: string | null
          payment_method: string | null
          payment_proof_url: string | null
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
          status?: 'pending' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
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
          admin_notes?: string | null
          coupon_id?: string | null
          coupon_code?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
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
          status?: 'pending' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
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
          admin_notes?: string | null
          coupon_id?: string | null
          coupon_code?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
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
          role: 'super_admin' | 'admin' | 'editor' | 'viewer' | 'customer'
          avatar_url: string | null
          phone: string | null
          birth_date: string | null
          dni: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'super_admin' | 'admin' | 'editor' | 'viewer' | 'customer'
          avatar_url?: string | null
          phone?: string | null
          birth_date?: string | null
          dni?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'super_admin' | 'admin' | 'editor' | 'viewer' | 'customer'
          avatar_url?: string | null
          phone?: string | null
          birth_date?: string | null
          dni?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          recipient_name: string
          phone: string | null
          street: string
          number: string
          floor: string | null
          apartment: string | null
          city: string
          state: string
          postal_code: string
          country: string
          additional_info: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          recipient_name: string
          phone?: string | null
          street: string
          number: string
          floor?: string | null
          apartment?: string | null
          city: string
          state: string
          postal_code: string
          country?: string
          additional_info?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          recipient_name?: string
          phone?: string | null
          street?: string
          number?: string
          floor?: string | null
          apartment?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          additional_info?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_payment_methods: {
        Row: {
          id: string
          user_id: string
          type: string
          label: string
          provider: string | null
          last_four: string | null
          expiry_month: number | null
          expiry_year: number | null
          mp_customer_id: string | null
          mp_card_id: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          label: string
          provider?: string | null
          last_four?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          mp_customer_id?: string | null
          mp_card_id?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          label?: string
          provider?: string | null
          last_four?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          mp_customer_id?: string | null
          mp_card_id?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_purchase_amount: number
          max_discount_amount: number | null
          usage_limit: number | null
          usage_count: number
          usage_limit_per_user: number
          is_active: boolean
          starts_at: string | null
          expires_at: string | null
          applicable_categories: string[] | null
          applicable_products: string[] | null
          excluded_products: string[] | null
          first_purchase_only: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value: number
          min_purchase_amount?: number
          max_discount_amount?: number | null
          usage_limit?: number | null
          usage_count?: number
          usage_limit_per_user?: number
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          excluded_products?: string[] | null
          first_purchase_only?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          min_purchase_amount?: number
          max_discount_amount?: number | null
          usage_limit?: number | null
          usage_count?: number
          usage_limit_per_user?: number
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
          applicable_categories?: string[] | null
          applicable_products?: string[] | null
          excluded_products?: string[] | null
          first_purchase_only?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          id: string
          coupon_id: string
          user_id: string | null
          user_email: string
          order_id: string | null
          discount_applied: number
          used_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          user_id?: string | null
          user_email: string
          order_id?: string | null
          discount_applied: number
          used_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          user_id?: string | null
          user_email?: string
          order_id?: string | null
          discount_applied?: number
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      shipping_costs: {
        Row: {
          id: string
          department: string
          cost: number
          free_shipping_threshold: number | null
          estimated_days_min: number
          estimated_days_max: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          department: string
          cost?: number
          free_shipping_threshold?: number | null
          estimated_days_min?: number
          estimated_days_max?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          department?: string
          cost?: number
          free_shipping_threshold?: number | null
          estimated_days_min?: number
          estimated_days_max?: number
          is_active?: boolean
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
      order_status: 'pending' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
      user_role: 'super_admin' | 'admin' | 'editor' | 'viewer' | 'customer'
      banner_position: 'hero' | 'secondary' | 'footer' | 'popup'
      discount_type: 'percentage' | 'fixed'
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
export type ProductWithCategory = Product & {
  categories?: { name: string; slug: string } | null
}
export type ProductVariant = Tables<'product_variants'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type User = Tables<'users'>
export type StoreSettings = Tables<'store_settings'>
export type Banner = Tables<'banners'>
export type Coupon = Tables<'coupons'>
export type CouponUsage = Tables<'coupon_usages'>
export type ShippingCost = Tables<'shipping_costs'>
