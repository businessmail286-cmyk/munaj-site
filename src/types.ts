export type UserRole = 'customer' | 'admin' | 'staff';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole | string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  icon?: string | null;
  display_order?: number;
  is_active?: boolean;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FoodItem {
  id: string;
  category_id?: string | null;
  category_name?: string | null;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_available?: boolean;
  available: boolean; // Alias for backward compatibility
  is_featured?: boolean;
  featured: boolean; // Alias for backward compatibility
  preparation_time?: number | string | null;
  restaurant_id?: string | null;
  options?: any;
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address: string;
  delivery_notes?: string | null;
  subtotal: number;
  delivery_fee: number;
  discount?: number;
  discount_amount?: number;
  total: number;
  payment_method: string;
  payment_status: PaymentStatus | string;
  status: OrderStatus | string;
  order_status: OrderStatus | string; // Alias for UI compatibility
  rider_id?: string | null;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  food_item_id?: string | null;
  food_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  subtotal: number; // Alias for total_price
  options?: any;
  created_at?: string;
  image_url?: string | null;
}

export interface NotificationItem {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type?: 'order' | 'support' | 'promo' | 'system' | string;
  order_id?: string | null;
  is_read?: boolean;
  read: boolean; // Alias for UI compatibility
  created_at: string;
}

export type SupportDbCategory =
  | 'order'
  | 'payment'
  | 'delivery'
  | 'missing_food'
  | 'refund'
  | 'other';

export type TicketCategory =
  | SupportDbCategory
  | 'Order Problem'
  | 'Payment'
  | 'Payment Problem'
  | 'Delivery'
  | 'Delivery Problem'
  | 'Food / Restaurant'
  | 'Missing Food'
  | 'Account'
  | 'Refund'
  | 'Refund Request'
  | 'Technical Issue'
  | 'Other'
  | string;

export type TicketPriority = 'normal' | 'low' | 'high' | 'urgent' | string;

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | string;

export interface SupportTicket {
  id: string;
  ticket_number?: number | string;
  customer_id: string;
  order_id?: string | null;
  subject: string;
  category: TicketCategory | string;
  priority?: TicketPriority | string;
  status: TicketStatus;
  assigned_to?: string | null;
  created_at: string;
  updated_at?: string;
  last_message_at?: string | null;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachment_url?: string | null;
  is_admin_message: boolean;
  is_read?: boolean;
  sender_type?: 'admin' | 'customer' | string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  image_url?: string | null;
  published: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Promotion {
  id: string;
  title: string;
  name?: string;
  description?: string | null;
  image_url?: string | null;
  discount: number;
  discount_value?: number;
  discount_type?: 'percentage' | 'fixed' | string;
  promo_code?: string;
  is_active?: boolean;
  active: boolean; // Alias for UI
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  message: string;
  rating: number;
  image_url?: string | null;
  role_or_location?: string;
  published: boolean;
  created_at: string;
}

export interface WebsiteSettings {
  id?: string;
  site_name: string;
  description: string;
  logo_url?: string | null;
  phone: string;
  email: string;
  address: string;
  delivery_fee: number;
  free_delivery_threshold?: number;
  currency: string;
  currency_symbol: string;
  opening_hours?: string;
  updated_at?: string;
}

export interface WebsiteBranding {
  site_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  tagline: string;
}

export interface PaymentSettings {
  id?: string;
  paystack_enabled: boolean;
  flutterwave_enabled: boolean;
  bank_transfer_enabled: boolean;
  cash_on_delivery_enabled: boolean;
  bank_name: string;
  account_name: string;
  account_number: string;
  transfer_instructions: string;
  payment_reference_instructions: string;
  currency: string;
  bank_logo?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ContactRequest {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  category?: string;
  customer_id?: string | null;
  status?: string;
  created_at?: string;
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  specialInstructions?: string;
}

export type ViewTab =
  | 'home'
  | 'menu'
  | 'food-detail'
  | 'cart'
  | 'checkout'
  | 'order-success'
  | 'order-tracking'
  | 'account'
  | 'support'
  | 'about'
  | 'contact'
  | 'admin';

