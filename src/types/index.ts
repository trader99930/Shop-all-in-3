export type UserRole = 'super_admin' | 'shopkeeper' | 'customer' | 'staff';

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'blocked';
  avatarUrl?: string;
  upiId?: string;
  shop?: Shop | null;
  shops?: Shop[];
}

export interface Shop {
  id: number;
  ownerId: number;
  name: string;
  slug: string;
  category: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  businessPhone: string;
  logoUrl?: string;
  bannerUrl?: string;
  themeColor: string;
  upiId?: string;
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  isTemporarilyClosed: boolean;
  openingTime: string;
  closingTime: string;
  weeklyClosedDay: string;
  homeDeliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryRadiusKm: string;
  minOrderAmount: string;
  deliveryFee: string;
  freeDeliveryThreshold: string;
  announcement?: string;
  createdAt: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: string;
  stock: number;
  sku?: string;
  imageUrl?: string;
}

export interface Product {
  id: number;
  shopId: number;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: string;
  discountPrice?: string;
  unit: string;
  sku?: string;
  stockQuantity: number;
  minOrderQty: number;
  maxOrderQty: number;
  brand?: string;
  tags?: string;
  imageUrl?: string;
  images?: string;
  isActive: boolean;
  isProhibited: boolean;
  createdAt: string;
  variants?: ProductVariant[];
}

export interface CartItem {
  id: number;
  quantity: number;
  variantId?: number | null;
  product: Product;
  variant?: ProductVariant | null;
  effectivePrice: number;
  subtotal: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId?: number | null;
  variantId?: number | null;
  productName: string;
  variantName?: string;
  unit: string;
  price: string;
  discount: string;
  quantity: number;
  total: string;
}

export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PACKING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface Order {
  id: number;
  orderNumber: string;
  shopId: number;
  userId: number;
  customerName: string;
  customerPhone: string;
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  addressType: 'home' | 'work' | 'other';
  landmark?: string;
  deliveryInstructions?: string;
  status: OrderStatus;
  subtotal: string;
  discountAmount: string;
  deliveryFee: string;
  taxAmount: string;
  totalAmount: string;
  paymentMethod: 'cash_on_delivery' | 'pay_at_store' | 'upi_online';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  upiReference?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  shop?: Partial<Shop>;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  shopId: number;
  customNotes?: string;
  createdAt: string;
}

export interface Review {
  id: number;
  shopId: number;
  userId: number;
  orderId?: number;
  rating: number;
  comment?: string;
  isModerated: boolean;
  createdAt: string;
  userName?: string;
}

export interface Offer {
  id: number;
  shopId: number;
  code: string;
  title: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderValue: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface NotificationItem {
  id: number;
  userId: number;
  shopId?: number;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'system' | 'alert';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  userId: number;
  shopId?: number;
  orderId?: number;
  subject: string;
  message: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  adminNotes?: string;
  createdAt: string;
}
