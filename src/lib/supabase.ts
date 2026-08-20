import { createClient } from '@supabase/supabase-js';
import {
  Profile,
  Category,
  FoodItem,
  Order,
  OrderItem,
  NotificationItem,
  SupportTicket,
  SupportMessage,
  Announcement,
  Promotion,
  Testimonial,
  WebsiteSettings,
  WebsiteBranding,
  PaymentSettings,
  ContactRequest,
} from '../types';
import {
  DEFAULT_WEBSITE_SETTINGS,
  DEFAULT_BRANDING,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_TESTIMONIALS,
} from '../data/defaults';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yqdlmmuxbseyzdbaymsy.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ByZFOml20RCB5vuE1kRrPQ_RJ3BXJ98';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Single reusable formatter for Nigerian Naira
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount || 0);
}

// ----------------- WEBSITE BRANDING & SETTINGS -----------------
export async function getWebsiteBranding(): Promise<WebsiteBranding> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'website_branding')
      .maybeSingle();

    if (error || !data || !data.value) {
      return DEFAULT_BRANDING;
    }

    let parsed = data.value;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = {};
      }
    }

    return {
      site_name: parsed.site_name || DEFAULT_BRANDING.site_name,
      logo_url: parsed.logo_url || DEFAULT_BRANDING.logo_url,
      favicon_url: parsed.favicon_url || DEFAULT_BRANDING.favicon_url,
      primary_color: parsed.primary_color || DEFAULT_BRANDING.primary_color,
      secondary_color: parsed.secondary_color || DEFAULT_BRANDING.secondary_color,
      accent_color: parsed.accent_color || DEFAULT_BRANDING.accent_color,
      text_color: parsed.text_color || DEFAULT_BRANDING.text_color,
      tagline: parsed.tagline || DEFAULT_BRANDING.tagline,
    };
  } catch (err) {
    console.warn('Error fetching website_branding from Supabase:', err);
    return DEFAULT_BRANDING;
  }
}

export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  try {
    // 1. Try key-value settings table
    const { data: kvData, error: kvError } = await supabase
      .from('settings')
      .select('key, value');

    if (!kvError && kvData && kvData.length > 0) {
      const kvMap: Record<string, any> = {};
      kvData.forEach((row) => {
        if (row.key) {
          kvMap[row.key] = row.value;
        }
      });

      return {
        site_name: kvMap.restaurant_name || kvMap.site_name || DEFAULT_WEBSITE_SETTINGS.site_name,
        description: kvMap.description || DEFAULT_WEBSITE_SETTINGS.description,
        logo_url: kvMap.logo_url || DEFAULT_WEBSITE_SETTINGS.logo_url,
        phone: kvMap.phone || DEFAULT_WEBSITE_SETTINGS.phone,
        email: kvMap.email || DEFAULT_WEBSITE_SETTINGS.email,
        address: kvMap.address || DEFAULT_WEBSITE_SETTINGS.address,
        delivery_fee: Number(kvMap.delivery_fee) || DEFAULT_WEBSITE_SETTINGS.delivery_fee,
        free_delivery_threshold: Number(kvMap.free_delivery_threshold) || DEFAULT_WEBSITE_SETTINGS.free_delivery_threshold,
        currency: 'NGN',
        currency_symbol: '₦',
        opening_hours: kvMap.opening_hours || DEFAULT_WEBSITE_SETTINGS.opening_hours,
      };
    }

    return DEFAULT_WEBSITE_SETTINGS;
  } catch (err) {
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

// ----------------- PAYMENT & BANK SETTINGS -----------------
export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        paystack_enabled: Boolean(data.paystack_enabled),
        flutterwave_enabled: Boolean(data.flutterwave_enabled),
        bank_transfer_enabled: Boolean(data.bank_transfer_enabled),
        cash_on_delivery_enabled: Boolean(data.cash_on_delivery_enabled),
        bank_name: data.bank_name || DEFAULT_PAYMENT_SETTINGS.bank_name,
        account_name: data.account_name || DEFAULT_PAYMENT_SETTINGS.account_name,
        account_number: data.account_number || DEFAULT_PAYMENT_SETTINGS.account_number,
        transfer_instructions: data.transfer_instructions || DEFAULT_PAYMENT_SETTINGS.transfer_instructions,
        payment_reference_instructions: data.payment_reference_instructions || DEFAULT_PAYMENT_SETTINGS.payment_reference_instructions,
        currency: data.currency || 'NGN',
        bank_logo: data.bank_logo || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }

    if (error) {
      console.warn('Could not load payment settings from public.payment_settings:', error.message);
    }

    return DEFAULT_PAYMENT_SETTINGS;
  } catch (err) {
    console.warn('Error loading payment settings:', err);
    return DEFAULT_PAYMENT_SETTINGS;
  }
}

export async function confirmBankTransferPayment(
  orderId: string,
  details?: { senderName?: string; transferReference?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Update order payment_status to 'pending'
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderError) {
      console.warn('Order status update notice:', orderError.message);
    }

    // 2. Try inserting payment record into public.payments if applicable
    try {
      if (user) {
        // Fetch order total if needed
        const { data: ord } = await supabase.from('orders').select('total, customer_id').eq('id', orderId).maybeSingle();
        if (ord) {
          await supabase.from('payments').insert({
            order_id: orderId,
            customer_id: ord.customer_id || user.id,
            amount: ord.total,
            provider: 'bank_transfer',
            method: 'Bank Transfer',
            status: 'pending',
          });
        }
      }
    } catch (payErr) {
      console.warn('Payment record log notice:', payErr);
    }

    // 3. Create in-app notification for the customer
    try {
      if (user) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'Bank Transfer Confirmation Sent',
          message: `We received your bank transfer confirmation for Order #${orderId.slice(0, 8).toUpperCase()}. Our accounting team is reviewing it.`,
          type: 'order',
          is_read: false,
        });
      }
    } catch (notifErr) {
      // Non-blocking
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error confirming bank transfer payment:', err);
    return { success: false, error: err.message || 'Failed to submit transfer confirmation' };
  }
}

// ----------------- CATEGORIES -----------------
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      image_url: cat.image_url || null,
      icon: cat.icon || null,
      display_order: cat.display_order ?? 0,
      is_active: cat.is_active ?? true,
      active: cat.is_active ?? true,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
    }));
  } catch (err) {
    console.warn('Error fetching categories from Supabase:', err);
    return [];
  }
}

// ----------------- FOOD ITEMS -----------------
export async function getFoodItems(): Promise<FoodItem[]> {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) {
      console.warn('Error fetching food items:', error);
      return [];
    }

    // Also fetch categories to attach category names accurately
    const categories = await getCategories();
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    return data.map((item) => {
      const isAvailable = item.is_available !== undefined ? Boolean(item.is_available) : item.available !== undefined ? Boolean(item.available) : true;
      const isFeatured = item.is_featured !== undefined ? Boolean(item.is_featured) : item.featured !== undefined ? Boolean(item.featured) : false;

      return {
        id: item.id,
        category_id: item.category_id,
        category_name: item.category_id ? catMap.get(item.category_id) || undefined : undefined,
        name: item.name || 'Delicious Dish',
        description: item.description || '',
        price: Number(item.price) || 0,
        image_url: item.image_url || null,
        is_available: isAvailable,
        available: isAvailable,
        is_featured: isFeatured,
        featured: isFeatured,
        preparation_time: item.preparation_time,
        restaurant_id: item.restaurant_id,
        options: item.options,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });
  } catch (err) {
    console.warn('Error fetching food items from Supabase:', err);
    return [];
  }
}

export async function getFoodItemById(id: string): Promise<FoodItem | null> {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    let categoryName: string | undefined = undefined;
    if (data.category_id) {
      const { data: catData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', data.category_id)
        .maybeSingle();
      if (catData) categoryName = catData.name;
    }

    const isAvailable = data.is_available !== undefined ? Boolean(data.is_available) : data.available !== undefined ? Boolean(data.available) : true;
    const isFeatured = data.is_featured !== undefined ? Boolean(data.is_featured) : data.featured !== undefined ? Boolean(data.featured) : false;

    return {
      id: data.id,
      category_id: data.category_id,
      category_name: categoryName,
      name: data.name,
      description: data.description,
      price: Number(data.price),
      image_url: data.image_url,
      is_available: isAvailable,
      available: isAvailable,
      is_featured: isFeatured,
      featured: isFeatured,
      preparation_time: data.preparation_time,
      restaurant_id: data.restaurant_id,
      options: data.options,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.warn('Error fetching food item by id:', err);
    return null;
  }
}

// ----------------- PROMOTIONS & ANNOUNCEMENTS & TESTIMONIALS -----------------
export async function getPromotions(): Promise<Promotion[]> {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((p) => {
      const discountVal = Number(p.discount_value ?? p.discount ?? 0);
      return {
        id: p.id,
        title: p.name || p.title || 'MUNAJ Special Offer',
        name: p.name || p.title || 'MUNAJ Special Offer',
        description: p.description,
        image_url: p.image_url,
        discount: discountVal,
        discount_value: discountVal,
        discount_type: p.discount_type || 'percentage',
        promo_code: p.promo_code || '',
        is_active: p.is_active ?? true,
        active: p.is_active ?? true,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    });
  } catch (err) {
    return [];
  }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((a: any) => ({
      id: a.id,
      title: a.title,
      message: a.message || '',
      image_url: null,
      published: true,
      created_at: a.created_at || new Date().toISOString(),
      updated_at: a.created_at,
    }));
  } catch (err) {
    return [];
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_TESTIMONIALS;
    }

    return data;
  } catch (err) {
    return DEFAULT_TESTIMONIALS;
  }
}

// Helper to check valid UUID format
function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ----------------- ORDERS -----------------
export function normalizePaymentMethodForDb(method?: string | null): string {
  if (!method) return 'bank_transfer';
  const m = method.toLowerCase().trim();
  if (m === 'bank transfer' || m === 'bank_transfer' || m === 'transfer') return 'bank_transfer';
  if (m === 'cash on delivery' || m === 'cash_on_delivery' || m === 'cod' || m === 'cash') return 'cash_on_delivery';
  if (m === 'paystack') return 'paystack';
  if (m === 'flutterwave') return 'flutterwave';
  return m.replace(/\s+/g, '_');
}

export function formatPaymentMethodForDisplay(method?: string | null): string {
  if (!method) return 'Bank Transfer';
  const m = method.toLowerCase().trim();
  if (m === 'bank_transfer' || m === 'bank transfer' || m === 'transfer') return 'Bank Transfer';
  if (m === 'cash_on_delivery' || m === 'cash on delivery' || m === 'cod' || m === 'cash') return 'Cash on Delivery';
  if (m === 'paystack') return 'Paystack';
  if (m === 'flutterwave') return 'Flutterwave';
  return method;
}

export interface CreateOrderParams {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethod: string;
  paymentStatus?: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount?: number;
  promoCode?: string;
  total: number;
  items: {
    foodItemId?: string | null;
    foodName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    options?: string | null;
  }[];
}

export async function createOrder(params: CreateOrderParams): Promise<{ order: Order; error: string | null }> {
  // 1. Mandatory Auth Verification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("ORDER PLACEMENT ERROR", {
      message: authError?.message || 'User must be authenticated to place an order',
      code: authError?.code || 'AUTH_REQUIRED',
      details: authError ? JSON.stringify(authError) : 'auth.getUser() returned null',
      hint: 'Please sign in to place your order.',
    });
    return {
      order: {} as Order,
      error: 'Please sign in or create an account to place your order.',
    };
  }

  const authenticatedUserId = user.id;

  // 1b. Customer Status Verification from public.profiles (Banned & Restricted check)
  try {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', authenticatedUserId)
      .maybeSingle();

    const currentStatus = profileRow?.status || 'active';
    if (currentStatus === 'banned') {
      return {
        order: {} as Order,
        error: 'Your MUNAJ account has been suspended. Please contact Customer Support if you believe this was a mistake.',
      };
    }
    if (currentStatus === 'restricted') {
      return {
        order: {} as Order,
        error: 'Your account currently has restricted access. Please contact MUNAJ Customer Support for assistance.',
      };
    }
  } catch (statusErr) {
    console.warn('Profile status check notice:', statusErr);
  }

  // 1c. Dynamic Payment Method Verification from public.payment_settings
  try {
    const currentPaymentSettings = await getPaymentSettings();
    const rawMethod = (params.paymentMethod || '').toLowerCase();
    let isMethodAllowed = true;

    if (rawMethod.includes('transfer') || rawMethod.includes('bank')) {
      isMethodAllowed = currentPaymentSettings.bank_transfer_enabled;
    } else if (rawMethod.includes('cash') || rawMethod.includes('cod') || rawMethod.includes('delivery')) {
      isMethodAllowed = currentPaymentSettings.cash_on_delivery_enabled;
    } else if (rawMethod.includes('paystack')) {
      isMethodAllowed = currentPaymentSettings.paystack_enabled;
    } else if (rawMethod.includes('flutterwave')) {
      isMethodAllowed = currentPaymentSettings.flutterwave_enabled;
    }

    if (!isMethodAllowed) {
      return {
        order: {} as Order,
        error: 'The selected payment method is currently disabled. Please choose an enabled payment method to complete your order.',
      };
    }
  } catch (payCheckErr) {
    console.warn('Payment settings verification notice:', payCheckErr);
  }

  const rawPaymentMethod = params.paymentMethod || 'bank_transfer';
  const dbPaymentMethod = normalizePaymentMethodForDb(rawPaymentMethod);
  const displayPaymentMethod = formatPaymentMethodForDisplay(rawPaymentMethod);
  const calculatedPaymentStatus = 'pending';

  // 2. Fetch active restaurant ID from database
  let activeRestaurantId: string = 'ad6e9d3a-ba84-4fd9-b0e5-ba796cb15551';
  try {
    const { data: restData } = await supabase.from('restaurants').select('id').limit(1).maybeSingle();
    if (restData?.id && isValidUuid(restData.id)) {
      activeRestaurantId = restData.id;
    }
  } catch (err) {
    console.warn('Restaurant ID fetch notice:', err);
  }

  // 3. Price Verification
  let verifiedSubtotal = 0;
  for (const it of params.items) {
    const qty = Math.max(1, Math.floor(it.quantity || 1));
    const price = Math.max(0, Number(it.unitPrice || 0));
    verifiedSubtotal += price * qty;
  }
  const verifiedDeliveryFee = Math.max(0, Number(params.deliveryFee || 0));
  const verifiedDiscount = Math.max(0, Number(params.discountAmount || 0));
  const verifiedTotal = Math.max(0, verifiedSubtotal + verifiedDeliveryFee - verifiedDiscount);

  // Format items for RPC execution
  const rpcItems = params.items.map((it) => ({
    food_item_id: isValidUuid(it.foodItemId) ? it.foodItemId : null,
    food_name: it.foodName,
    quantity: Math.max(1, Math.floor(it.quantity || 1)),
    unit_price: Number(it.unitPrice),
    options: it.options !== null && it.options !== undefined ? it.options : {},
  }));

  const rpcArgs = {
    p_customer_name: params.customerName.trim(),
    p_customer_phone: params.customerPhone.trim(),
    p_delivery_address: params.deliveryAddress.trim(),
    p_items: rpcItems,
    p_delivery_fee: verifiedDeliveryFee,
    p_promo_code: params.promoCode || null,
    p_delivery_notes: params.deliveryNotes?.trim() || null,
    p_payment_method: dbPaymentMethod,
    p_restaurant_id: activeRestaurantId,
  };

  // 4. Direct Atomic INSERT (Using Exact Real Schema Columns and DB payment method)
  // In public.orders: order_number is bigint, so we do NOT pass a string
  const orderPayload: Record<string, any> = {
    customer_id: authenticatedUserId,
    restaurant_id: activeRestaurantId,
    customer_name: params.customerName.trim(),
    customer_phone: params.customerPhone.trim(),
    delivery_address: params.deliveryAddress.trim(),
    subtotal: verifiedSubtotal,
    delivery_fee: verifiedDeliveryFee,
    discount: verifiedDiscount,
    total: verifiedTotal,
    payment_method: dbPaymentMethod,
    payment_status: 'pending',
    status: 'pending',
  };

  const orderItemsPayload = params.items.map((it) => ({
    food_item_id: isValidUuid(it.foodItemId) ? it.foodItemId : null,
    food_name: it.foodName,
    unit_price: Number(it.unitPrice),
    quantity: Math.max(1, Math.floor(it.quantity || 1)),
    total_price: Number(it.unitPrice * (Math.max(1, Math.floor(it.quantity || 1)))),
    options: it.options !== null && it.options !== undefined ? it.options : {},
  }));

  try {
    let orderData: any = null;
    let orderError: any = null;

    const res1 = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    orderData = res1.data;
    orderError = res1.error;

    // If check constraint fails on payment_method, attempt alternative fallback representations
    if (orderError && orderError.code === '23514' && orderError.message?.includes('orders_payment_method_check')) {
      console.warn('Retrying order insert with compatible payment_method values for check constraint...');
      
      const candidateList: string[] = [];
      if (dbPaymentMethod === 'flutterwave') {
        candidateList.push('online', 'card', 'paystack', 'bank_transfer', 'transfer', 'cash_on_delivery', 'cash', 'pos', 'Flutterwave', 'flutterwave', 'Online', 'Card', 'Paystack');
      } else if (dbPaymentMethod === 'paystack') {
        candidateList.push('online', 'card', 'bank_transfer', 'transfer', 'cash_on_delivery', 'cash', 'pos', 'Paystack', 'paystack', 'Online', 'Card');
      } else if (dbPaymentMethod === 'bank_transfer') {
        candidateList.push('transfer', 'card', 'online', 'bank_transfer', 'Bank Transfer', 'Transfer', 'cash_on_delivery', 'cash');
      } else if (dbPaymentMethod === 'cash_on_delivery') {
        candidateList.push('cash', 'cod', 'cash_on_delivery', 'Cash on Delivery', 'Cash', 'bank_transfer', 'transfer');
      } else {
        candidateList.push('bank_transfer', 'cash_on_delivery', 'online', 'card', 'paystack', 'transfer', 'cash');
      }

      // Add general safety fallbacks
      const standardFallbacks = ['bank_transfer', 'cash_on_delivery', 'transfer', 'cash', 'card', 'online', 'paystack'];
      for (const sf of standardFallbacks) {
        if (!candidateList.includes(sf)) candidateList.push(sf);
      }

      for (const altMethod of candidateList) {
        if (altMethod === dbPaymentMethod) continue;
        const retryRes = await supabase
          .from('orders')
          .insert({ ...orderPayload, payment_method: altMethod })
          .select()
          .single();
        if (!retryRes.error && retryRes.data) {
          orderData = retryRes.data;
          orderError = null;
          console.log(`Order insert succeeded with compatible payment_method: "${altMethod}"`);
          break;
        }
      }
    }

    if (orderError) {
      console.error("ORDER PLACEMENT ERROR", {
        message: orderError?.message,
        code: orderError?.code,
        details: orderError?.details,
        hint: orderError?.hint,
      });

      console.error("MUNAJ ORDER CONTEXT", {
        authenticatedUserId,
        cartContents: params.items,
        orderPayload,
        orderItemsPayload,
        rpcName: 'create_order',
        rpcArguments: rpcArgs,
      });

      const errString = 'Unable to place your order right now. Please check your delivery details and try again.';
      return {
        order: {} as Order,
        error: errString,
      };
    }

    const createdOrderId = orderData.id;
    const finalOrderNumber = orderData.order_number ? String(orderData.order_number) : createdOrderId.slice(0, 8).toUpperCase();

    // Insert order items using exact schema: order_id, food_item_id, food_name, unit_price, quantity, total_price, options
    if (params.items && params.items.length > 0) {
      let itemsToInsert = orderItemsPayload.map((it) => ({
        order_id: createdOrderId,
        ...it,
      }));

      let { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)
        .select();

      // If initial insert encountered an issue with options representation, retry with stringified or empty object
      if (itemsError) {
        console.warn('Initial order_items insert failed, attempting fallback options format:', itemsError.message);
        const fallbackItems = itemsToInsert.map((it) => ({
          ...it,
          options: typeof it.options === 'object' ? JSON.stringify(it.options) : {},
        }));
        const retryRes = await supabase.from('order_items').insert(fallbackItems).select();
        if (!retryRes.error && retryRes.data) {
          insertedItems = retryRes.data;
          itemsError = null;
        }
      }

      if (itemsError) {
        console.error("ORDER PLACEMENT ERROR", {
          message: itemsError?.message,
          code: itemsError?.code,
          details: itemsError?.details,
          hint: itemsError?.hint,
        });

        console.error("MUNAJ ORDER ITEMS CONTEXT", {
          authenticatedUserId,
          orderId: createdOrderId,
          itemsToInsert,
        });

        const itemsErrString = 'Unable to save order items. Please try again.';
        return {
          order: {} as Order,
          error: itemsErrString,
        };
      } else {
        console.log("ORDER ITEMS INSERTED SUCCESSFULLY:", insertedItems);
      }
    }

    // Insert payment record into public.payments if applicable
    try {
      await supabase.from('payments').insert({
        order_id: createdOrderId,
        customer_id: authenticatedUserId,
        amount: verifiedTotal,
        provider: dbPaymentMethod,
        method: displayPaymentMethod,
        status: calculatedPaymentStatus,
      });
    } catch (payErr) {
      console.warn('Payment record log notice:', payErr);
    }

    // Insert user notification
    try {
      await supabase.from('notifications').insert({
        user_id: authenticatedUserId,
        title: `Order Placed #${finalOrderNumber}`,
        message: `Your order #${finalOrderNumber} for ${formatNaira(verifiedTotal)} (${displayPaymentMethod}) has been received and sent to the kitchen.`,
        type: 'order',
        is_read: false,
      });
    } catch (notifErr) {
      console.warn('Notification insert notice:', notifErr);
    }

    const fullOrder: Order = {
      id: createdOrderId,
      order_number: finalOrderNumber,
      customer_id: authenticatedUserId,
      customer_name: orderData.customer_name || params.customerName,
      customer_phone: orderData.customer_phone || params.customerPhone,
      customer_email: params.customerEmail || user.email || null,
      delivery_address: orderData.delivery_address || params.deliveryAddress,
      delivery_notes: params.deliveryNotes,
      subtotal: Number(orderData.subtotal ?? verifiedSubtotal),
      delivery_fee: Number(orderData.delivery_fee ?? verifiedDeliveryFee),
      discount: Number(orderData.discount || 0),
      discount_amount: Number(orderData.discount || 0),
      total: Number(orderData.total ?? verifiedTotal),
      payment_method: displayPaymentMethod,
      payment_status: orderData.payment_status || 'pending',
      status: orderData.status || 'pending',
      order_status: orderData.status || 'pending',
      created_at: orderData.created_at || new Date().toISOString(),
      updated_at: orderData.updated_at,
      items: params.items.map((it, idx) => ({
        id: `item-${idx}-${createdOrderId}`,
        order_id: createdOrderId,
        food_item_id: it.foodItemId,
        food_name: it.foodName,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.subtotal,
        subtotal: it.subtotal,
        options: it.options,
      })),
    };

    return { order: fullOrder, error: null };
  } catch (err: any) {
    console.error("ORDER PLACEMENT ERROR", {
      message: err?.message,
      code: err?.code,
      details: err?.details || err?.stack,
      hint: err?.hint,
    });
    console.error("MUNAJ ORDER CONTEXT", {
      authenticatedUserId,
      cartContents: params.items,
      orderPayload,
      orderItemsPayload,
    });
    const catchErrString = 'Unable to complete your order right now. Please check your connection and try again.';
    return {
      order: {} as Order,
      error: catchErrString,
    };
  }
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (ordersError || !ordersData) {
      return [];
    }

    // Fetch order items for each order
    const orderIds = ordersData.map((o) => o.id);
    const itemsByOrderId: Record<string, OrderItem[]> = {};

    if (orderIds.length > 0) {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*, food_items(name)')
        .in('order_id', orderIds);

      if (itemsData) {
        itemsData.forEach((it: any) => {
          if (!itemsByOrderId[it.order_id]) {
            itemsByOrderId[it.order_id] = [];
          }
          const resolvedName = it.food_items?.name || it.food_name || 'Delicious Nigerian Dish';
          itemsByOrderId[it.order_id].push({
            id: it.id,
            order_id: it.order_id,
            food_item_id: it.food_item_id,
            food_name: resolvedName,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            total_price: Number(it.total_price || it.unit_price * it.quantity),
            subtotal: Number(it.total_price || it.unit_price * it.quantity),
            options: it.options,
            created_at: it.created_at,
          });
        });
      }
    }

    return ordersData.map((o) => {
      const st = o.status || 'Pending';
      return {
        id: o.id,
        order_number: String(o.order_number || o.id.slice(0, 8).toUpperCase()),
        customer_id: o.customer_id,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        delivery_address: o.delivery_address,
        subtotal: Number(o.subtotal),
        delivery_fee: Number(o.delivery_fee),
        discount: Number(o.discount || 0),
        discount_amount: Number(o.discount || 0),
        total: Number(o.total),
        payment_method: o.payment_method || 'Cash on Delivery',
        payment_status: o.payment_status || 'Pending',
        status: st,
        order_status: st,
        rider_id: o.rider_id,
        created_at: o.created_at,
        updated_at: o.updated_at,
        items: itemsByOrderId[o.id] || [],
      };
    });
  } catch (err) {
    console.warn('Error fetching customer orders:', err);
    return [];
  }
}

export async function getOrderById(orderIdOrNumber: string): Promise<Order | null> {
  try {
    let query = supabase.from('orders').select('*');
    // Check if UUID or integer/string order_number
    if (orderIdOrNumber.length === 36 && orderIdOrNumber.includes('-')) {
      query = query.eq('id', orderIdOrNumber);
    } else {
      query = query.or(`id.eq.${orderIdOrNumber},order_number.eq.${orderIdOrNumber}`);
    }

    const { data: orderData, error } = await query.maybeSingle();
    if (error || !orderData) return null;

    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*, food_items(name)')
      .eq('order_id', orderData.id);

    const st = orderData.status || 'Pending';

    return {
      id: orderData.id,
      order_number: String(orderData.order_number || orderData.id.slice(0, 8).toUpperCase()),
      customer_id: orderData.customer_id,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      delivery_address: orderData.delivery_address,
      subtotal: Number(orderData.subtotal),
      delivery_fee: Number(orderData.delivery_fee),
      discount: Number(orderData.discount || 0),
      discount_amount: Number(orderData.discount || 0),
      total: Number(orderData.total),
      payment_method: orderData.payment_method || 'Cash on Delivery',
      payment_status: orderData.payment_status || 'Pending',
      status: st,
      order_status: st,
      rider_id: orderData.rider_id,
      created_at: orderData.created_at,
      updated_at: orderData.updated_at,
      items: itemsData
        ? itemsData.map((it: any) => ({
            id: it.id,
            order_id: it.order_id,
            food_item_id: it.food_item_id,
            food_name: it.food_items?.name || it.food_name || 'Delicious Nigerian Dish',
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            total_price: Number(it.total_price || it.unit_price * it.quantity),
            subtotal: Number(it.total_price || it.unit_price * it.quantity),
            options: it.options,
            created_at: it.created_at,
          }))
        : [],
    };
  } catch (err) {
    console.warn('Error retrieving order:', err);
    return null;
  }
}

// ----------------- NOTIFICATIONS -----------------
export async function getCustomerNotifications(userId?: string): Promise<NotificationItem[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const currentUserId = user?.id || userId;

    let query = supabase.from('notifications').select('*');

    if (currentUserId) {
      // Both notifications for this customer AND broadcasts where user_id is NULL
      query = query.or(`user_id.eq.${currentUserId},user_id.is.null`);
    } else {
      // If not logged in, retrieve general broadcasts where user_id IS NULL
      query = query.is('user_id', null);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching notifications from Supabase:', error);
      return [];
    }

    if (!data) return [];

    return data.map((n: any) => ({
      id: n.id,
      user_id: n.user_id,
      title: n.title || 'Notification',
      message: n.message || '',
      type: n.type || 'system',
      order_id: n.order_id || null,
      is_read: Boolean(n.is_read),
      read: Boolean(n.is_read),
      created_at: n.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Error in getCustomerNotifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(id: string, userId?: string): Promise<void> {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      targetUserId = user?.id;
    }

    let query = supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }
    const { error } = await query;
    if (error) {
      console.warn('Note on marking notification as read in database:', error?.message);
    }
  } catch (err) {
    console.warn('Error marking notification as read:', err);
  }
}

// ----------------- SUPPORT TICKETS & CHAT -----------------
export type ValidSupportCategory =
  | 'order'
  | 'payment'
  | 'delivery'
  | 'missing_food'
  | 'refund'
  | 'other';

export const VALID_SUPPORT_CATEGORIES: ValidSupportCategory[] = [
  'order',
  'payment',
  'delivery',
  'missing_food',
  'refund',
  'other',
];

export const SUPPORT_CATEGORY_OPTIONS: { value: ValidSupportCategory; label: string }[] = [
  { value: 'order', label: 'Order Problem' },
  { value: 'payment', label: 'Payment Problem' },
  { value: 'delivery', label: 'Delivery Problem' },
  { value: 'missing_food', label: 'Missing Food' },
  { value: 'refund', label: 'Refund Request' },
  { value: 'other', label: 'Other' },
];

export function normalizeSupportCategory(rawCategory?: string | null): ValidSupportCategory {
  if (!rawCategory) return 'other';
  const val = rawCategory.toLowerCase().trim().replace(/[\s\-_]+/g, '_');

  if (val === 'order' || val.includes('order')) return 'order';
  if (val === 'payment' || val.includes('pay')) return 'payment';
  if (val === 'delivery' || val.includes('deliver') || val.includes('shipping')) return 'delivery';
  if (val === 'missing_food' || val.includes('missing') || val.includes('food') || val.includes('restaurant')) return 'missing_food';
  if (val === 'refund' || val.includes('refund') || val.includes('return')) return 'refund';
  if (val === 'other' || val === 'general' || val.includes('inquiry') || val.includes('feedback') || val.includes('complaint') || val.includes('technical') || val.includes('account')) return 'other';

  if (VALID_SUPPORT_CATEGORIES.includes(val as ValidSupportCategory)) {
    return val as ValidSupportCategory;
  }
  return 'other';
}

export function getSupportCategoryLabel(category?: string | null): string {
  const norm = normalizeSupportCategory(category);
  const found = SUPPORT_CATEGORY_OPTIONS.find((o) => o.value === norm);
  return found ? found.label : 'Other';
}

export async function getCustomerTickets(customerId?: string): Promise<SupportTicket[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const targetId = user?.id || customerId;
    if (!targetId) return [];

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('customer_id', targetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("SUPPORT ERROR", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      return [];
    }
    return (data as SupportTicket[]) || [];
  } catch (err: any) {
    console.error("SUPPORT ERROR", { message: err?.message });
    return [];
  }
}

export async function getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
  try {
    if (!ticketId || !isValidUuid(ticketId)) return [];

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("SUPPORT ERROR", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      return [];
    }
    return (data as SupportMessage[]) || [];
  } catch (err: any) {
    console.error("SUPPORT ERROR", { message: err?.message });
    return [];
  }
}

export async function createSupportTicket(params: {
  customerId?: string;
  orderId?: string | null;
  subject: string;
  category: string;
  priority?: string;
  message: string;
  attachmentUrl?: string | null;
}): Promise<{ ticket: SupportTicket | null; error?: string }> {
  try {
    // 1. Authenticate user via supabase.auth.getUser()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id || !isValidUuid(user.id)) {
      console.error("MUNAJ SUPPORT MESSAGE ERROR", {
        message: authError?.message || 'User must be authenticated to create a support ticket',
        code: authError?.name || 'AUTH_REQUIRED',
        details: (authError as any)?.details || authError?.message,
        hint: 'Please log in to contact MUNAJ Support.',
      });
      return { ticket: null, error: 'Please log in to contact MUNAJ Support.' };
    }

    // 2. Validate category to strictly be one of: order, payment, delivery, missing_food, refund, other
    const validCategory: ValidSupportCategory = normalizeSupportCategory(params.category);

    // 3. Insert into public.support_tickets using ONLY required fields:
    // customer_id = auth.uid(), subject, category, priority (and order_id if linked)
    // Do NOT send a message field into support_tickets.
    // Let the database default status to open.
    const ticketPayload: {
      customer_id: string;
      subject: string;
      category: ValidSupportCategory;
      priority: string;
      order_id?: string | null;
    } = {
      customer_id: user.id,
      subject: params.subject.trim(),
      category: validCategory,
      priority: params.priority || 'normal',
    };

    if (params.orderId && isValidUuid(params.orderId)) {
      ticketPayload.order_id = params.orderId;
    }

    const { data: ticketData, error: ticketError } = await supabase
      .from('support_tickets')
      .insert(ticketPayload)
      .select()
      .single();

    if (ticketError || !ticketData) {
      console.error("MUNAJ SUPPORT MESSAGE ERROR", {
        message: ticketError?.message,
        code: ticketError?.code,
        details: ticketError?.details,
        hint: ticketError?.hint,
      });
      return {
        ticket: null,
        error: 'Unable to open support ticket. Please try again.',
      };
    }

    // 4. Retrieve newly created ticket ID and insert customer's actual message into public.support_messages
    const { error: msgError } = await supabase.from('support_messages').insert({
      ticket_id: ticketData.id,
      sender_id: user.id,
      message: params.message.trim(),
      attachment_url: params.attachmentUrl || null,
      is_admin_message: false,
    });

    if (msgError) {
      console.error("MUNAJ SUPPORT MESSAGE ERROR", {
        message: msgError?.message,
        code: msgError?.code,
        details: msgError?.details,
        hint: msgError?.hint,
      });
      return {
        ticket: ticketData as SupportTicket,
        error: 'Ticket opened, but your initial message could not be delivered. Please try sending a message in the ticket conversation.',
      };
    }

    return { ticket: ticketData as SupportTicket };
  } catch (err: any) {
    console.error("MUNAJ SUPPORT MESSAGE ERROR", {
      message: err?.message,
      code: err?.code || 'UNHANDLED_EXCEPTION',
      details: err?.details || String(err),
      hint: err?.hint,
    });
    return { ticket: null, error: 'Failed to create support ticket. Please try again.' };
  }
}

export async function sendSupportMessage(params: {
  ticketId: string;
  senderId?: string;
  message: string;
  attachmentUrl?: string | null;
}): Promise<{ message: SupportMessage | null; error?: string }> {
  try {
    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id || !isValidUuid(user.id)) {
      console.error("MUNAJ SUPPORT MESSAGE ERROR", {
        message: authError?.message || 'User must be authenticated to send a support message',
        code: authError?.name || 'AUTH_REQUIRED',
        details: (authError as any)?.details || authError?.message,
        hint: 'Please sign in to send messages.',
      });
      return {
        message: null,
        error: 'Please sign in or create an account to send support messages.',
      };
    }

    // 2. Validate ticket ID format
    if (!params.ticketId || !isValidUuid(params.ticketId)) {
      console.error("MUNAJ SUPPORT MESSAGE ERROR", {
        message: `Invalid ticket ID: ${params.ticketId}`,
        code: 'INVALID_TICKET_ID',
        details: null,
        hint: 'Selected ticket ID must be a valid UUID.',
      });
      return {
        message: null,
        error: 'Support ticket not found. Please refresh the page.',
      };
    }

    // 3. Verify that the selected ticket belongs to the authenticated customer
    const { data: ticketCheck, error: ticketCheckError } = await supabase
      .from('support_tickets')
      .select('id, customer_id')
      .eq('id', params.ticketId)
      .eq('customer_id', user.id)
      .single();

    if (ticketCheckError || !ticketCheck) {
      console.error("MUNAJ SUPPORT MESSAGE ERROR", {
        message: ticketCheckError?.message || 'Ticket does not exist or does not belong to authenticated customer',
        code: ticketCheckError?.code || 'TICKET_ACCESS_DENIED',
        details: ticketCheckError?.details,
        hint: ticketCheckError?.hint || 'Check if ticket exists and customer_id matches authenticated user.',
      });
      return {
        message: null,
        error: 'Ticket not found or access is restricted for this conversation.',
      };
    }

    // 4. Exact message INSERT
    const insertPayload: {
      ticket_id: string;
      sender_id: string;
      message: string;
      is_admin_message: boolean;
      attachment_url?: string | null;
    } = {
      ticket_id: params.ticketId,
      sender_id: user.id,
      message: params.message.trim(),
      is_admin_message: false,
    };

    if (params.attachmentUrl) {
      insertPayload.attachment_url = params.attachmentUrl;
    }

    const { data, error } = await supabase
      .from('support_messages')
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      console.error("MUNAJ SUPPORT MESSAGE ERROR", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      return {
        message: null,
        error: 'Unable to send message right now. Please check your connection and try again.',
      };
    }

    // 5. Update support ticket updated_at & last_message_at
    try {
      await supabase
        .from('support_tickets')
        .update({
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', params.ticketId);
    } catch {
      // Ignored if DB trigger updates it
    }

    return { message: data as SupportMessage };
  } catch (err: any) {
    console.error("MUNAJ SUPPORT MESSAGE ERROR", {
      message: err?.message,
      code: err?.code || 'UNHANDLED_EXCEPTION',
      details: err?.details || String(err),
      hint: err?.hint,
    });
    return {
      message: null,
      error: 'Unable to send message. Please try again.',
    };
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) {
      console.error("SUPPORT ERROR", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("SUPPORT ERROR", { message: err?.message });
    return { success: false, error: err?.message };
  }
}

export async function uploadSupportAttachment(userId: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `support_${userId}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('support-attachments')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(filePath);
      return urlData.publicUrl;
    }
    return null;
  } catch (err) {
    console.warn('Attachment upload error:', err);
    return null;
  }
}

// ----------------- PROFILE MANAGEMENT -----------------
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (err) {
    return null;
  }
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating profile in Supabase:', error);
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn('Avatar upload failed:', err);
    return null;
  }
}

// ----------------- CONTACT & INQUIRIES -----------------
export async function submitContactRequest(params: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category?: string;
  customerId?: string | null;
}): Promise<{ success: boolean; ticket?: SupportTicket | null; error: string | null }> {
  try {
    // 1. Verify authentication (required by Supabase support_tickets RLS policy)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id || !isValidUuid(user.id)) {
      console.error("MUNAJ CONTACT FORM ERROR", {
        message: authError?.message || 'User must be authenticated to create a support ticket',
        code: authError?.name || 'AUTH_REQUIRED',
        details: (authError as any)?.details || authError?.message,
        hint: 'Please log in to contact MUNAJ Support.',
      });
      return {
        success: false,
        ticket: null,
        error: 'Authentication Required: Please sign in or create an account to send your message directly to MUNAJ Support and receive live responses.',
      };
    }

    // 2. Validate & normalize category for support_tickets (order, payment, delivery, missing_food, refund, other)
    const validCategory: ValidSupportCategory = normalizeSupportCategory(params.category);

    const ticketPayload: {
      customer_id: string;
      subject: string;
      category: ValidSupportCategory;
      priority: string;
    } = {
      customer_id: user.id,
      subject: `[Contact Form] ${params.subject.trim()}`,
      category: validCategory,
      priority: 'normal',
    };

    const { data: ticketData, error: ticketError } = await supabase
      .from('support_tickets')
      .insert(ticketPayload)
      .select()
      .single();

    if (ticketError || !ticketData) {
      console.error("MUNAJ CONTACT FORM ERROR", {
        message: ticketError?.message,
        code: ticketError?.code,
        details: ticketError?.details,
        hint: ticketError?.hint,
      });
      return {
        success: false,
        ticket: null,
        error: 'Unable to submit your contact message. Please try again.',
      };
    }

    // 3. Format message with all contact form details
    const formattedMessage = [
      `Customer Contact Inquiry`,
      `• Full Name: ${params.name.trim()}`,
      `• Email: ${params.email.trim()}`,
      `• Phone: ${params.phone?.trim() || 'Not provided'}`,
      `• Inquiry Topic: ${params.category || 'General Inquiry'}`,
      `• Subject: ${params.subject.trim()}`,
      `\nMessage:\n${params.message.trim()}`,
    ].join('\n');

    // 4. Insert into public.support_messages
    const { error: msgError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketData.id,
        sender_id: user.id,
        message: formattedMessage,
        is_admin_message: false,
      });

    if (msgError) {
      console.error("MUNAJ CONTACT FORM ERROR", {
        message: msgError?.message,
        code: msgError?.code,
        details: msgError?.details,
        hint: msgError?.hint,
      });
      return {
        success: false,
        ticket: null,
        error: 'Inquiry received, but message body could not be saved. Please try again.',
      };
    }

    // 5. Touch ticket updated_at and last_message_at
    try {
      await supabase
        .from('support_tickets')
        .update({
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', ticketData.id);
    } catch {
      // Trigger handles timestamp if present
    }

    return {
      success: true,
      ticket: ticketData as SupportTicket,
      error: null,
    };
  } catch (err: any) {
    console.error("MUNAJ CONTACT FORM ERROR", {
      message: err?.message,
      code: err?.code || 'UNHANDLED_EXCEPTION',
      details: err?.details || String(err),
      hint: err?.hint,
    });
    return {
      success: false,
      ticket: null,
      error: 'Unable to submit your contact inquiry right now. Please try again.',
    };
  }
}
