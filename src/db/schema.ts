import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or system ID
  email: text('email').notNull(),
  name: text('name').notNull(),
  phone: text('phone').default(''),
  role: text('role').notNull().default('customer'), // 'super_admin' | 'shopkeeper' | 'customer' | 'staff'
  status: text('status').notNull().default('active'), // 'active' | 'blocked'
  avatarUrl: text('avatar_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Platform global categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').default('Store'),
  description: text('description').default(''),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Shops table (multi-tenant isolation)
export const shops = pgTable('shops', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull().default('Grocery'),
  description: text('description').default(''),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pincode: text('pincode').notNull(),
  businessPhone: text('business_phone').notNull(),
  logoUrl: text('logo_url').default(''),
  bannerUrl: text('banner_url').default(''),
  themeColor: text('theme_color').default('#059669'),
  status: text('status').notNull().default('active'), // 'pending' | 'active' | 'rejected' | 'suspended'
  isTemporarilyClosed: boolean('is_temporarily_closed').notNull().default(false),
  openingTime: text('opening_time').notNull().default('09:00'),
  closingTime: text('closing_time').notNull().default('21:00'),
  weeklyClosedDay: text('weekly_closed_day').notNull().default('None'),
  homeDeliveryEnabled: boolean('home_delivery_enabled').notNull().default(true),
  pickupEnabled: boolean('pickup_enabled').notNull().default(true),
  deliveryRadiusKm: numeric('delivery_radius_km').default('10'),
  minOrderAmount: numeric('min_order_amount').default('100'),
  deliveryFee: numeric('delivery_fee').default('30'),
  freeDeliveryThreshold: numeric('free_delivery_threshold').default('500'),
  announcement: text('announcement').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description').default(''),
  category: text('category').notNull(),
  subcategory: text('subcategory').default(''),
  price: numeric('price').notNull(),
  discountPrice: numeric('discount_price').default('0'),
  unit: text('unit').notNull().default('Piece'), // Piece, Kg, Gram, Litre, ml, Packet, Box, Dozen, Meter, Pair, Set
  sku: text('sku').default(''),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  minOrderQty: integer('min_order_qty').default(1),
  maxOrderQty: integer('max_order_qty').default(99),
  brand: text('brand').default(''),
  tags: text('tags').default(''),
  imageUrl: text('image_url').default(''),
  images: text('images').default('[]'), // JSON array of string image URLs
  isActive: boolean('is_active').notNull().default(true),
  isProhibited: boolean('is_prohibited').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Product Variants table
export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  name: text('name').notNull(), // e.g. "500g", "1kg", "Size M", "128GB"
  price: numeric('price').notNull(),
  stock: integer('stock').notNull().default(0),
  sku: text('sku').default(''),
  imageUrl: text('image_url').default(''),
});

// Carts table
export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Cart items table
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id')
    .references(() => carts.id)
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  variantId: integer('variant_id'),
  quantity: integer('quantity').notNull().default(1),
});

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // e.g. YUN-2026-8742
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  orderType: text('order_type').notNull().default('delivery'), // 'delivery' | 'pickup'
  deliveryAddress: text('delivery_address').default(''),
  addressType: text('address_type').default('home'), // 'home' | 'work' | 'other'
  landmark: text('landmark').default(''),
  deliveryInstructions: text('delivery_instructions').default(''),
  status: text('status').notNull().default('NEW'), // 'NEW' | 'ACCEPTED' | 'PACKING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'
  subtotal: numeric('subtotal').notNull(),
  discountAmount: numeric('discount_amount').notNull().default('0'),
  deliveryFee: numeric('delivery_fee').notNull().default('0'),
  taxAmount: numeric('tax_amount').notNull().default('0'),
  totalAmount: numeric('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull().default('cash_on_delivery'), // 'cash_on_delivery' | 'pay_at_store' | 'upi_online'
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending' | 'paid' | 'refunded'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Order Items table (capturing historical snapshot of price/name)
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  productId: integer('product_id'),
  variantId: integer('variant_id'),
  productName: text('product_name').notNull(),
  variantName: text('variant_name').default(''),
  unit: text('unit').notNull().default('Piece'),
  price: numeric('price').notNull(),
  discount: numeric('discount').default('0'),
  quantity: integer('quantity').notNull(),
  total: numeric('total').notNull(),
});

// Invoices table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(), // e.g. INV-YUNAY-1002
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  customNotes: text('custom_notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  orderId: integer('order_id').references(() => orders.id),
  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment').default(''),
  isModerated: boolean('is_moderated').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Offers / Discounts table
export const offers = pgTable('offers', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .references(() => shops.id)
    .notNull(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  discountType: text('discount_type').notNull().default('percentage'), // 'percentage' | 'fixed'
  discountValue: numeric('discount_value').notNull(),
  minOrderValue: numeric('min_order_value').default('0'),
  startDate: text('start_date').default(''),
  endDate: text('end_date').default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  shopId: integer('shop_id'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('info'), // 'order' | 'stock' | 'system' | 'alert'
  isRead: boolean('is_read').notNull().default(false),
  link: text('link').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Support tickets table
export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  shopId: integer('shop_id'),
  orderId: integer('order_id'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  category: text('category').notNull().default('General'), // 'Order Issue' | 'Shop Issue' | 'Refund' | 'Account' | 'General'
  status: text('status').notNull().default('open'), // 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: text('priority').notNull().default('normal'), // 'low' | 'normal' | 'high'
  adminNotes: text('admin_notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Platform settings table (Super admin controls)
export const platformSettings = pgTable('platform_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description').default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Admin Audit Logs
export const adminLogs = pgTable('admin_logs', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id')
    .references(() => users.id)
    .notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(), // 'shop' | 'user' | 'product' | 'category' | 'setting'
  targetId: text('target_id').notNull(),
  details: text('details').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Drizzle relations
export const usersRelations = relations(users, ({ many, one }) => ({
  shops: many(shops),
  orders: many(orders),
  reviews: many(reviews),
  notifications: many(notifications),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  owner: one(users, {
    fields: [shops.ownerId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
  reviews: many(reviews),
  offers: many(offers),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  shop: one(shops, {
    fields: [products.shopId],
    references: [shops.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  shop: one(shops, {
    fields: [orders.shopId],
    references: [shops.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  invoice: one(invoices, {
    fields: [orders.id],
    references: [invoices.orderId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));
