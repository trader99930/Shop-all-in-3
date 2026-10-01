import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import {
  users,
  shops,
  categories,
  products,
  productVariants,
  orders,
  orderItems,
  invoices,
  reviews,
  offers,
  platformSettings,
  notifications,
  adminLogs,
  supportTickets,
  carts,
  cartItems,
} from '../db/schema.ts';
import { eq, and, desc, sql, ilike, or, inArray, gte, count } from 'drizzle-orm';
import {
  requireAuth,
  optionalAuth,
  requireSuperAdmin,
  requireShopOwner,
  requireCustomer,
  requireShopAccess,
  requireOrderAccess,
  signSessionToken,
  AuthRequest,
} from '../middleware/auth.ts';
import QRCode from 'qrcode';

export const apiRouter = Router();

// Dynamic Super Admin ID resolver (never hardcoded to 1)
async function getSuperAdminId(): Promise<number> {
  const admin = await db.select({ id: users.id }).from(users).where(eq(users.role, 'super_admin')).limit(1);
  if (admin.length > 0) return admin[0].id;
  const anyUser = await db.select({ id: users.id }).from(users).limit(1);
  return anyUser.length > 0 ? anyUser[0].id : 1;
}

// Centralized audit logger
async function logAdminAction(
  adminId: number,
  action: string,
  targetType: 'shop' | 'user' | 'product' | 'category' | 'setting',
  targetId: string,
  details: string = ''
) {
  try {
    await db.insert(adminLogs).values({
      adminId,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (err) {
    console.warn('Failed to record admin audit log:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION & USER PROFILE
// ==========================================

apiRouter.get('/auth/me', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user && !req.dbUser) {
      return res.json({ user: null });
    }

    let user = req.dbUser;
    if (!user && req.user?.uid) {
      const found = await db.select().from(users).where(eq(users.uid, req.user.uid)).limit(1);
      user = found[0];
    }

    if (!user) {
      return res.json({ user: null });
    }

    // If user has a shop (or is shopkeeper/super_admin), find their shops
    let userShop = null;
    let allUserShops: any[] = [];
    if (user.role === 'shopkeeper' || user.role === 'super_admin') {
      const userShops = await db
        .select()
        .from(shops)
        .where(eq(shops.ownerId, user.id))
        .orderBy(desc(shops.id));
      if (userShops.length > 0) {
        userShop = userShops[0];
        allUserShops = userShops;
      }
    }

    res.json({
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        shop: userShop,
        shops: allUserShops,
      },
    });
  } catch (error: any) {
    console.error('Error fetching /auth/me:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user session' });
  }
});

// Demo switch role / user
apiRouter.post('/auth/demo-switch', async (req: Request, res: Response) => {
  try {
    const { role, email, uid } = req.body;
    let targetUser;

    if (uid) {
      const found = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      targetUser = found[0];
    }
    if (!targetUser && email) {
      const cleanEmail = email.trim();
      const found = await db
        .select()
        .from(users)
        .where(or(ilike(users.email, cleanEmail), eq(users.uid, cleanEmail)))
        .limit(1);
      targetUser = found[0];
    }
    if (!targetUser && role) {
      const found = await db.select().from(users).where(eq(users.role, role)).limit(1);
      targetUser = found[0];
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    let userShop = null;
    let allUserShops: any[] = [];
    const foundShops = await db
      .select()
      .from(shops)
      .where(eq(shops.ownerId, targetUser.id))
      .orderBy(desc(shops.id));
    if (foundShops.length > 0) {
      userShop = foundShops[0];
      allUserShops = foundShops;
    }

    const sessionToken = signSessionToken({
      uid: targetUser.uid,
      dbId: targetUser.id,
      role: targetUser.role,
      email: targetUser.email,
      name: targetUser.name,
    });

    res.json({
      token: sessionToken,
      user: {
        id: targetUser.id,
        uid: targetUser.uid,
        email: targetUser.email,
        name: targetUser.name,
        phone: targetUser.phone,
        role: targetUser.role,
        status: targetUser.status,
        avatarUrl: targetUser.avatarUrl,
        shop: userShop,
        shops: allUserShops,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Direct Login (Mobile Number or Email for Customers & Shopkeepers, or ID "Yunu" with Password "1122" for Admin)
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password = '', role = 'customer' } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Please enter your Mobile Number, Email, or Admin ID (Yunu)' });
    }

    const cleanIdentifier = identifier.trim();
    const cleanLower = cleanIdentifier.toLowerCase();
    const isEmail = cleanIdentifier.includes('@');
    const digitsOnly = cleanIdentifier.replace(/\D/g, '');

    let user: any = null;

    // 1. ADMIN CHECK:
    // Admin does NOT need signup or email. Logs in directly with ID "Yunu" (or "admin") and Password "1122"
    const isAdminIdentifier = cleanLower === 'yunu' || cleanLower === 'admin' || cleanLower === 'yunay admin';

    if (isAdminIdentifier) {
      if (password !== '1122') {
        return res.status(401).json({
          error: 'Incorrect Admin password. Please enter 1122.',
        });
      }

      // Ensure super_admin exists in DB
      const adminUsers = await db.select().from(users).where(eq(users.role, 'super_admin')).limit(1);
      if (adminUsers.length > 0) {
        user = adminUsers[0];
      } else {
        const [newAdmin] = await db
          .insert(users)
          .values({
            uid: 'admin-yunu',
            email: 'admin@yunay.in',
            name: 'YUNAY Admin',
            phone: '0000000000',
            role: 'super_admin',
            status: 'active',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          })
          .returning();
        user = newAdmin;
      }
    } else {
      // 2. NORMAL USER LOOKUP (Customer or Shopkeeper)
      // All other users must sign up first before signing in!
      if (isEmail) {
        const found = await db.select().from(users).where(ilike(users.email, cleanLower)).limit(1);
        if (found.length > 0) {
          user = found[0];
        }
      } else if (digitsOnly.length >= 7) {
        const last10 = digitsOnly.slice(-10);
        const phoneMatch = await db.execute(
          sql`SELECT * FROM users WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${'%' + last10} OR email ILIKE ${'%' + cleanLower + '%'}`
        );
        const rows = phoneMatch.rows as any[];
        if (rows.length > 0) {
          user = rows.find((r) => r.role === role) || rows.find((r) => r.role !== 'super_admin') || rows[0];
        }
      } else {
        const found = await db
          .select()
          .from(users)
          .where(or(ilike(users.email, `%${cleanLower}%`), ilike(users.phone, `%${cleanIdentifier}%`)))
          .limit(1);
        if (found.length > 0) {
          user = found[0];
        }
      }

      // If user does not exist: DO NOT AUTO CREATE. User must sign up first!
      if (!user) {
        return res.status(404).json({
          error: 'Account not found. Please Sign Up first as a Customer or Shop Owner before signing in.',
        });
      }

      // If account found happens to be super_admin, require 1122 password
      if (user.role === 'super_admin' && password !== '1122') {
        return res.status(401).json({
          error: 'Super Admin access requires the master password (1122).',
        });
      }
    }

    // 3. FIND LINKED SHOPS
    let foundShops: any[] = [];
    if (user.role === 'shopkeeper' || user.role === 'super_admin') {
      // Find all shops owned by this user
      foundShops = await db
        .select()
        .from(shops)
        .where(eq(shops.ownerId, user.id))
        .orderBy(desc(shops.id));

      // Also check if phone matches any shop businessPhone
      if (foundShops.length === 0 && digitsOnly.length >= 7) {
        const last10 = digitsOnly.slice(-10);
        const shopPhoneMatch = await db.execute(
          sql`SELECT * FROM shops WHERE regexp_replace(business_phone, '[^0-9]', '', 'g') LIKE ${'%' + last10} ORDER BY id DESC`
        );
        if (shopPhoneMatch.rows.length > 0) {
          foundShops = shopPhoneMatch.rows as any[];
          for (const sh of foundShops) {
            if (user.role !== 'super_admin') {
              await db.update(shops).set({ ownerId: user.id }).where(eq(shops.id, sh.id));
              sh.ownerId = user.id;
            }
          }
        }
      }
    }

    // If user owns shops, ensure role is shopkeeper (unless super_admin)
    if (foundShops.length > 0 && user.role === 'customer') {
      await db.update(users).set({ role: 'shopkeeper' }).where(eq(users.id, user.id));
      user.role = 'shopkeeper';
    }

    const userShop = foundShops[0] || null;

    const sessionToken = signSessionToken({
      uid: user.uid,
      dbId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    res.json({
      token: sessionToken,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        shop: userShop,
        shops: foundShops,
      },
    });
  } catch (error: any) {
    console.error('Error in /auth/login:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Register new customer
apiRouter.post('/auth/register-customer', async (req: Request, res: Response) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || (!phone && !email)) {
      return res.status(400).json({ error: 'Name and either Mobile or Email are required' });
    }

    const cleanEmail = email?.trim() || `${phone.replace(/\D/g, '')}@customer.yunay.in`;
    const cleanPhone = phone?.trim() || '';

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(or(ilike(users.email, cleanEmail), cleanPhone ? ilike(users.phone, `%${cleanPhone}%`) : undefined))
      .limit(1);

    if (existing.length > 0) {
      const existingUser = existing[0];
      const sessionToken = signSessionToken({
        uid: existingUser.uid,
        dbId: existingUser.id,
        role: existingUser.role,
        email: existingUser.email,
        name: existingUser.name,
      });
      return res.json({ token: sessionToken, user: existingUser });
    }

    const uid = `customer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const [newUser] = await db
      .insert(users)
      .values({
        uid,
        email: cleanEmail,
        name,
        phone: cleanPhone,
        role: 'customer',
        status: 'active',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      })
      .returning();

    const sessionToken = signSessionToken({
      uid: newUser.uid,
      dbId: newUser.id,
      role: newUser.role,
      email: newUser.email,
      name: newUser.name,
    });

    res.status(201).json({ token: sessionToken, user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register as Vendor / Create Shop
apiRouter.post('/auth/register-vendor', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      ownerName,
      email,
      phone,
      shopName,
      category,
      description,
      address,
      city,
      state,
      pincode,
      businessPhone,
      logoUrl,
      bannerUrl,
      openingTime,
      closingTime,
      weeklyClosedDay,
      homeDeliveryEnabled,
      pickupEnabled,
      deliveryRadiusKm,
      minOrderAmount,
      deliveryFee,
      freeDeliveryThreshold,
    } = req.body;

    if (!shopName || !ownerName || !email || !address || !city || !pincode) {
      return res.status(400).json({ error: 'Missing required onboarding fields' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : (businessPhone ? businessPhone.trim() : '');

    // 1. Determine or create vendor user
    let vendorUser: any = null;

    if (req.dbUser && req.dbUser.role === 'customer') {
      const [updated] = await db
        .update(users)
        .set({
          role: 'shopkeeper',
          name: ownerName || req.dbUser.name,
          phone: cleanPhone || req.dbUser.phone,
          email: cleanEmail || req.dbUser.email,
        })
        .where(eq(users.id, req.dbUser.id))
        .returning();
      vendorUser = updated;
    } else if (req.dbUser && req.dbUser.role === 'shopkeeper') {
      vendorUser = req.dbUser;
    } else {
      const existing = await db
        .select()
        .from(users)
        .where(
          or(
            ilike(users.email, cleanEmail),
            cleanPhone ? ilike(users.phone, `%${cleanPhone}%`) : undefined
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0].role !== 'super_admin') {
        const [updated] = await db
          .update(users)
          .set({
            role: 'shopkeeper', // Strict: always shopkeeper
            name: ownerName || existing[0].name,
            phone: cleanPhone || existing[0].phone,
          })
          .where(eq(users.id, existing[0].id))
          .returning();
        vendorUser = updated;
      } else {
        const uid = `vendor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const [created] = await db
          .insert(users)
          .values({
            uid,
            email: cleanEmail,
            name: ownerName,
            phone: cleanPhone,
            role: 'shopkeeper', // Strict: shop owner must only be shopkeeper
            status: 'active',
            avatarUrl:
              logoUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          })
          .returning();
        vendorUser = created;
      }
    }

    // 2. Generate unique slug
    let baseSlug = shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = `shop-${Date.now()}`;

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existingSlug = await db.select().from(shops).where(eq(shops.slug, slug)).limit(1);
      if (existingSlug.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // 3. Create shop
    const [newShop] = await db
      .insert(shops)
      .values({
        ownerId: vendorUser.id,
        name: shopName,
        slug,
        category: category || 'Grocery',
        description: description || '',
        address,
        city,
        state: state || '',
        pincode,
        businessPhone: businessPhone || phone,
        logoUrl: logoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80',
        bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
        themeColor: '#059669',
        status: 'active', // Auto active or pending per settings
        isTemporarilyClosed: false,
        openingTime: openingTime || '09:00',
        closingTime: closingTime || '21:00',
        weeklyClosedDay: weeklyClosedDay || 'None',
        homeDeliveryEnabled: homeDeliveryEnabled !== false,
        pickupEnabled: pickupEnabled !== false,
        deliveryRadiusKm: String(deliveryRadiusKm || 10),
        minOrderAmount: String(minOrderAmount || 100),
        deliveryFee: String(deliveryFee || 30),
        freeDeliveryThreshold: String(freeDeliveryThreshold || 500),
      })
      .returning();

    // 4. Create notification for admin
    const adminList = await db.select({ id: users.id }).from(users).where(eq(users.role, 'super_admin')).limit(1);
    const targetAdminId = adminList.length > 0 ? adminList[0].id : 1;
    await db.insert(notifications).values({
      userId: targetAdminId,
      shopId: newShop.id,
      title: 'New Vendor Registered',
      message: `${shopName} registered under ${category} in ${city}.`,
      type: 'system',
    });

    const sessionToken = signSessionToken({
      uid: vendorUser.uid,
      dbId: vendorUser.id,
      role: vendorUser.role || 'shopkeeper',
      email: vendorUser.email,
      name: vendorUser.name,
    });

    res.status(201).json({
      token: sessionToken,
      shop: newShop,
      user: {
        id: vendorUser.id,
        uid: vendorUser.uid,
        email: vendorUser.email,
        name: vendorUser.name,
        role: vendorUser.role || 'shopkeeper',
        shop: newShop,
      },
    });
  } catch (error: any) {
    console.error('Error in vendor registration:', error);
    res.status(500).json({ error: error.message || 'Vendor onboarding failed' });
  }
});

// ==========================================
// 2. CATEGORIES (GLOBAL)
// ==========================================

apiRouter.get('/categories', async (_req: Request, res: Response) => {
  try {
    const list = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder, categories.name);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/categories', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }
    const { name, icon, description, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const [newCat] = await db
      .insert(categories)
      .values({
        name,
        slug,
        icon: icon || 'Store',
        description: description || '',
        sortOrder: sortOrder || 0,
        isActive: true,
      })
      .returning();

    res.status(201).json(newCat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/categories/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }
    const id = parseInt(req.params.id, 10);
    const { name, icon, description, sortOrder, isActive } = req.body;

    const [updated] = await db
      .update(categories)
      .set({
        name,
        icon,
        description,
        sortOrder,
        isActive,
      })
      .where(eq(categories.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/categories/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }
    const id = parseInt(req.params.id, 10);
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. SHOPS & STOREFRONTS
// ==========================================

// Discover all active shops with search and filters
apiRouter.get('/shops', async (req: Request, res: Response) => {
  try {
    const { category, search, city, status } = req.query;

    let query = db.select().from(shops);
    const conditions = [];

    if (status && status !== 'all' && String(status).trim() !== '') {
      conditions.push(eq(shops.status, String(status)));
    } else if (status === undefined) {
      // By default public discovery only shows active shops
      conditions.push(eq(shops.status, 'active'));
    }

    if (category && category !== 'All') {
      conditions.push(eq(shops.category, String(category)));
    }

    if (city && city !== 'All') {
      conditions.push(ilike(shops.city, `%${String(city)}%`));
    }

    if (search) {
      const term = `%${String(search)}%`;
      conditions.push(
        or(
          ilike(shops.name, term),
          ilike(shops.description, term),
          ilike(shops.address, term),
          ilike(shops.category, term),
          ilike(shops.pincode, term)
        )
      );
    }

    const results = await query
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(shops.createdAt));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get shop by slug or ID
apiRouter.get('/shops/:slugOrId', async (req: Request, res: Response) => {
  try {
    const param = req.params.slugOrId;
    const isId = /^\d+$/.test(param);

    const condition = isId ? eq(shops.id, parseInt(param, 10)) : eq(shops.slug, param);
    const shopList = await db.select().from(shops).where(condition).limit(1);

    if (shopList.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const shop = shopList[0];

    // Fetch shop products
    const productList = await db
      .select()
      .from(products)
      .where(and(eq(products.shopId, shop.id), eq(products.isActive, true), eq(products.isProhibited, false)))
      .orderBy(products.category, products.name);

    // Fetch product variants for these products
    const productIds = productList.map((p) => p.id);
    let variants: any[] = [];
    if (productIds.length > 0) {
      variants = await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds));
    }

    // Attach variants to products
    const productsWithVariants = productList.map((p) => ({
      ...p,
      variants: variants.filter((v) => v.productId === p.id),
    }));

    // Fetch shop offers
    const shopOffers = await db
      .select()
      .from(offers)
      .where(and(eq(offers.shopId, shop.id), eq(offers.isActive, true)));

    // Fetch shop reviews
    const shopReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.shopId, shop.id))
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    // Calculate rating aggregate
    const ratingStats = await db
      .select({
        avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 5.0)::numeric(2,1)`,
        totalReviews: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.shopId, shop.id));

    res.json({
      shop,
      products: productsWithVariants,
      offers: shopOffers,
      reviews: shopReviews,
      stats: {
        avgRating: Number(ratingStats[0]?.avgRating || 5.0),
        totalReviews: Number(ratingStats[0]?.totalReviews || 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update shop details (Shopkeeper or Super Admin)
apiRouter.put('/shops/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.id, 10);
    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);

    if (shop.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Tenant authorization check
    const currentUserId = req.dbUser?.id || req.user?.dbId;
    const isSuperAdmin = req.user?.role === 'super_admin' || req.dbUser?.role === 'super_admin';
    const isOwner = Number(shop[0].ownerId) === Number(currentUserId);

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Unauthorized: You can only edit your own shop' });
    }

    const {
      name,
      category,
      description,
      address,
      city,
      state,
      pincode,
      businessPhone,
      logoUrl,
      bannerUrl,
      themeColor,
      isTemporarilyClosed,
      openingTime,
      closingTime,
      weeklyClosedDay,
      homeDeliveryEnabled,
      pickupEnabled,
      deliveryRadiusKm,
      minOrderAmount,
      deliveryFee,
      freeDeliveryThreshold,
      announcement,
    } = req.body;

    const [updated] = await db
      .update(shops)
      .set({
        name,
        category,
        description,
        address,
        city,
        state,
        pincode,
        businessPhone,
        logoUrl,
        bannerUrl,
        themeColor,
        isTemporarilyClosed: Boolean(isTemporarilyClosed),
        openingTime,
        closingTime,
        weeklyClosedDay,
        homeDeliveryEnabled: homeDeliveryEnabled !== false,
        pickupEnabled: pickupEnabled !== false,
        deliveryRadiusKm: String(deliveryRadiusKm || 10),
        minOrderAmount: String(minOrderAmount || 100),
        deliveryFee: String(deliveryFee || 30),
        freeDeliveryThreshold: String(freeDeliveryThreshold || 500),
        announcement,
      })
      .where(eq(shops.id, shopId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Shop QR Code
apiRouter.get('/shops/:id/qr', async (req: Request, res: Response) => {
  try {
    const shopId = parseInt(req.params.id, 10);
    const found = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (found.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const shop = found[0];
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const shopUrl = `${protocol}://${host}/shop/${shop.slug}`;

    const qrDataUrl = await QRCode.toDataURL(shopUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    res.json({
      shopName: shop.name,
      shopSlug: shop.slug,
      shopUrl,
      qrDataUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. PRODUCT MANAGEMENT (MERCHANT CRUD)
// ==========================================

// Add Product
apiRouter.post('/shops/:id/products', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.id, 10);
    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const currentUserId = req.dbUser?.id || req.user?.dbId;
    const isSuperAdmin = req.user?.role === 'super_admin' || req.dbUser?.role === 'super_admin';
    const isOwner = Number(shop[0].ownerId) === Number(currentUserId);

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Unauthorized: You can only add products to your own shop' });
    }

    const {
      name,
      description,
      category,
      subcategory,
      price,
      discountPrice,
      unit,
      sku,
      stockQuantity,
      minOrderQty,
      maxOrderQty,
      brand,
      tags,
      imageUrl,
      images,
      variants,
    } = req.body;

    if (!name || !price || !unit) {
      return res.status(400).json({ error: 'Product name, price, and unit are required' });
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        shopId,
        name,
        description: description || '',
        category: category || shop[0].category,
        subcategory: subcategory || '',
        price: String(price),
        discountPrice: String(discountPrice || 0),
        unit: unit || 'Piece',
        sku: sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        minOrderQty: parseInt(minOrderQty, 10) || 1,
        maxOrderQty: parseInt(maxOrderQty, 10) || 99,
        brand: brand || '',
        tags: tags || '',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
        images: JSON.stringify(images || []),
        isActive: true,
        isProhibited: false,
      })
      .returning();

    // Insert variants if provided
    let insertedVariants: any[] = [];
    if (Array.isArray(variants) && variants.length > 0) {
      const variantRows = variants.map((v: any) => ({
        productId: newProduct.id,
        name: v.name,
        price: String(v.price || newProduct.price),
        stock: parseInt(v.stock, 10) || 0,
        sku: v.sku || `${newProduct.sku}-${v.name.replace(/\s+/g, '')}`,
        imageUrl: v.imageUrl || newProduct.imageUrl,
      }));
      insertedVariants = await db.insert(productVariants).values(variantRows).returning();
    }

    res.status(201).json({ ...newProduct, variants: insertedVariants });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Product
apiRouter.put('/shops/:shopId/products/:productId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const productId = parseInt(req.params.productId, 10);

    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const currentUserId = req.dbUser?.id || req.user?.dbId;
    const isSuperAdmin = req.user?.role === 'super_admin' || req.dbUser?.role === 'super_admin';
    const isOwner = Number(shop[0].ownerId) === Number(currentUserId);

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Unauthorized: You can only update products for your own shop' });
    }

    const {
      name,
      description,
      category,
      subcategory,
      price,
      discountPrice,
      unit,
      sku,
      stockQuantity,
      minOrderQty,
      maxOrderQty,
      brand,
      tags,
      imageUrl,
      images,
      isActive,
      variants,
    } = req.body;

    const [updatedProduct] = await db
      .update(products)
      .set({
        name,
        description,
        category,
        subcategory,
        price: String(price),
        discountPrice: String(discountPrice || 0),
        unit,
        sku,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        minOrderQty: parseInt(minOrderQty, 10) || 1,
        maxOrderQty: parseInt(maxOrderQty, 10) || 99,
        brand,
        tags,
        imageUrl,
        images: typeof images === 'string' ? images : JSON.stringify(images || []),
        isActive: isActive !== false,
      })
      .where(and(eq(products.id, productId), eq(products.shopId, shopId)))
      .returning();

    // Update variants if provided
    if (Array.isArray(variants)) {
      // Clear old variants and re-insert
      await db.delete(productVariants).where(eq(productVariants.productId, productId));
      if (variants.length > 0) {
        const variantRows = variants.map((v: any) => ({
          productId,
          name: v.name,
          price: String(v.price || updatedProduct.price),
          stock: parseInt(v.stock, 10) || 0,
          sku: v.sku || `${updatedProduct.sku}-${v.name}`,
          imageUrl: v.imageUrl || updatedProduct.imageUrl,
        }));
        await db.insert(productVariants).values(variantRows);
      }
    }

    res.json(updatedProduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Product (soft delete to protect historical orders)
apiRouter.delete('/shops/:shopId/products/:productId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const productId = parseInt(req.params.productId, 10);

    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const currentUserId = req.dbUser?.id || req.user?.dbId;
    const isSuperAdmin = req.user?.role === 'super_admin' || req.dbUser?.role === 'super_admin';
    const isOwner = Number(shop[0].ownerId) === Number(currentUserId);

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete products from your own shop' });
    }

    // Mark as inactive so historical orders stay intact
    await db.update(products).set({ isActive: false }).where(and(eq(products.id, productId), eq(products.shopId, shopId)));
    res.json({ success: true, message: 'Product deleted/archived successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Duplicate Product
apiRouter.post('/shops/:shopId/products/:productId/duplicate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const productId = parseInt(req.params.productId, 10);

    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const currentUserId = req.dbUser?.id || req.user?.dbId;
    const isSuperAdmin = req.user?.role === 'super_admin' || req.dbUser?.role === 'super_admin';
    const isOwner = Number(shop[0].ownerId) === Number(currentUserId);

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Unauthorized: You can only duplicate products in your own shop' });
    }

    const original = await db.select().from(products).where(and(eq(products.id, productId), eq(products.shopId, shopId))).limit(1);
    if (original.length === 0) return res.status(404).json({ error: 'Original product not found' });

    const p = original[0];
    const [duplicated] = await db
      .insert(products)
      .values({
        shopId,
        name: `${p.name} (Copy)`,
        description: p.description,
        category: p.category,
        subcategory: p.subcategory,
        price: p.price,
        discountPrice: p.discountPrice,
        unit: p.unit,
        sku: `${p.sku}-COPY-${Date.now().toString(36).substring(3, 7).toUpperCase()}`,
        stockQuantity: p.stockQuantity,
        minOrderQty: p.minOrderQty,
        maxOrderQty: p.maxOrderQty,
        brand: p.brand,
        tags: p.tags,
        imageUrl: p.imageUrl,
        images: p.images,
        isActive: true,
        isProhibited: false,
      })
      .returning();

    res.status(201).json(duplicated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk Product CSV Upload
apiRouter.post('/shops/:shopId/products/bulk-upload', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const currentUserId = req.dbUser?.id || req.user?.dbId;
    const isSuperAdmin = req.user?.role === 'super_admin' || req.dbUser?.role === 'super_admin';
    const isOwner = Number(shop[0].ownerId) === Number(currentUserId);

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Unauthorized: You can only import products into your own shop' });
    }

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided for bulk import' });
    }

    const successes: any[] = [];
    const failures: { row: number; name: string; reason: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.name || !row.price) {
        failures.push({ row: i + 1, name: row.name || 'Unknown', reason: 'Missing Product Name or Price' });
        continue;
      }

      try {
        const [inserted] = await db
          .insert(products)
          .values({
            shopId,
            name: String(row.name).trim(),
            description: row.description || '',
            category: row.category || shop[0].category,
            subcategory: row.subcategory || '',
            price: String(row.price),
            discountPrice: String(row.discountPrice || 0),
            unit: row.unit || 'Piece',
            sku: row.sku || `SKU-${Date.now().toString(36)}-${i}`,
            stockQuantity: parseInt(row.stockQuantity, 10) || 0,
            brand: row.brand || '',
            tags: row.tags || '',
            imageUrl: row.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
            images: JSON.stringify([]),
            isActive: true,
          })
          .returning();
        successes.push(inserted);
      } catch (err: any) {
        failures.push({ row: i + 1, name: row.name, reason: err.message || 'Validation error' });
      }
    }

    res.json({
      total: items.length,
      successCount: successes.length,
      failureCount: failures.length,
      successes,
      failures,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. PUBLIC PRODUCT SEARCH & DISCOVERY
// ==========================================

apiRouter.get('/products/search', async (req: Request, res: Response) => {
  try {
    const { q, category, city } = req.query;
    const term = `%${String(q || '')}%`;

    let query = db
      .select({
        product: products,
        shop: {
          id: shops.id,
          name: shops.name,
          slug: shops.slug,
          city: shops.city,
          businessPhone: shops.businessPhone,
          themeColor: shops.themeColor,
          isTemporarilyClosed: shops.isTemporarilyClosed,
          openingTime: shops.openingTime,
          closingTime: shops.closingTime,
        },
      })
      .from(products)
      .innerJoin(shops, eq(products.shopId, shops.id))
      .where(
        and(
          eq(products.isActive, true),
          eq(products.isProhibited, false),
          eq(shops.status, 'active'),
          or(
            ilike(products.name, term),
            ilike(products.description, term),
            ilike(products.tags, term),
            ilike(products.category, term)
          )
        )
      )
      .limit(30);

    const results = await query;
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. CART MANAGEMENT (Single-Shop Rules)
// ==========================================

// Get active cart for user
apiRouter.get('/cart', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.dbId || req.dbUser?.id;
    if (!userId) {
      return res.json({ cart: null, items: [], shop: null, subtotal: 0 });
    }
    const userCart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);

    if (userCart.length === 0) {
      return res.json({ cart: null, items: [], shop: null });
    }

    const cart = userCart[0];
    const shop = await db.select().from(shops).where(eq(shops.id, cart.shopId)).limit(1);

    const items = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        variantId: cartItems.variantId,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    // Also get variant details if applicable
    const variantIds = items.map((i) => i.variantId).filter(Boolean) as number[];
    let variantsList: any[] = [];
    if (variantIds.length > 0) {
      variantsList = await db.select().from(productVariants).where(inArray(productVariants.id, variantIds));
    }

    const enrichedItems = items.map((item) => {
      const v = variantsList.find((vr) => vr.id === item.variantId);
      const effectivePrice = v ? Number(v.price) : Number(item.product.discountPrice && Number(item.product.discountPrice) > 0 ? item.product.discountPrice : item.product.price);
      return {
        ...item,
        variant: v || null,
        effectivePrice,
        subtotal: effectivePrice * item.quantity,
      };
    });

    const subtotal = enrichedItems.reduce((acc, curr) => acc + curr.subtotal, 0);

    res.json({
      cart,
      shop: shop[0] || null,
      items: enrichedItems,
      subtotal,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add Item to Cart (checks single-shop constraint)
apiRouter.post('/cart/items', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.dbId!;
    const { shopId, productId, variantId, quantity = 1, forceSwitchShop = false } = req.body;

    // Check product stock and availability
    const prod = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (prod.length === 0 || !prod[0].isActive || prod[0].isProhibited) {
      return res.status(400).json({ error: 'Product is unavailable' });
    }

    let existingCart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);

    if (existingCart.length > 0) {
      const cart = existingCart[0];
      if (cart.shopId !== shopId) {
        if (!forceSwitchShop) {
          return res.status(409).json({
            error: 'CART_DIFFERENT_SHOP',
            currentShopId: cart.shopId,
            message: 'Your cart already contains items from another shop. Do you want to clear your current cart and switch to this shop?',
          });
        } else {
          // Clear current cart items and change shop
          await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
          await db.update(carts).set({ shopId, updatedAt: new Date() }).where(eq(carts.id, cart.id));
        }
      }
    } else {
      // Create new cart
      const [newCart] = await db
        .insert(carts)
        .values({
          userId,
          shopId,
        })
        .returning();
      existingCart = [newCart];
    }

    const cart = existingCart[0];

    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, productId),
          variantId ? eq(cartItems.variantId, variantId) : sql`${cartItems.variantId} IS NULL`
        )
      )
      .limit(1);

    if (existingItem.length > 0) {
      await db
        .update(cartItems)
        .set({ quantity: existingItem[0].quantity + quantity })
        .where(eq(cartItems.id, existingItem[0].id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity,
      });
    }

    res.json({ success: true, message: 'Item added to cart' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Cart Item Quantity
apiRouter.put('/cart/items/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const { quantity } = req.body;
    const userId = req.user!.dbId!;

    // Verify item belongs to requesting user's cart
    const item = await db
      .select({ id: cartItems.id, cartId: cartItems.cartId })
      .from(cartItems)
      .innerJoin(carts, eq(cartItems.cartId, carts.id))
      .where(and(eq(cartItems.id, itemId), eq(carts.userId, userId)))
      .limit(1);

    if (item.length === 0) {
      return res.status(404).json({ error: 'Cart item not found or unauthorized' });
    }

    if (quantity <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, itemId));
    } else {
      await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, itemId));
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove Single Cart Item
apiRouter.delete('/cart/items/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const userId = req.user!.dbId!;

    const item = await db
      .select({ id: cartItems.id })
      .from(cartItems)
      .innerJoin(carts, eq(cartItems.cartId, carts.id))
      .where(and(eq(cartItems.id, itemId), eq(carts.userId, userId)))
      .limit(1);

    if (item.length === 0) {
      return res.status(404).json({ error: 'Cart item not found or unauthorized' });
    }

    await db.delete(cartItems).where(eq(cartItems.id, itemId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clear Cart
apiRouter.delete('/cart', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.dbId!;
    const cart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (cart.length > 0) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart[0].id));
      await db.delete(carts).where(eq(carts.id, cart[0].id));
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. ORDER & CHECKOUT & BILLING SYSTEM
// ==========================================

// Create Order (Server-Side Price Calculation & Stock Check)
apiRouter.post('/orders', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.dbId!;
    const {
      shopId,
      customerName,
      customerPhone,
      orderType, // 'delivery' | 'pickup'
      deliveryAddress,
      addressType,
      landmark,
      deliveryInstructions,
      paymentMethod, // 'cash_on_delivery' | 'pay_at_store' | 'upi_online'
      couponCode,
      items, // array of { productId, variantId, quantity }
    } = req.body;

    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain items and target shop' });
    }

    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });
    const targetShop = shop[0];

    if (targetShop.status !== 'active') {
      return res.status(400).json({ error: 'Shop is currently not accepting orders' });
    }

    // 1. Fetch current live products and variants from DB to calculate true server-side totals
    const productIds = items.map((i) => i.productId);
    const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));
    const variantIds = items.map((i) => i.variantId).filter(Boolean) as number[];
    let dbVariants: any[] = [];
    if (variantIds.length > 0) {
      dbVariants = await db.select().from(productVariants).where(inArray(productVariants.id, variantIds));
    }

    let calculatedSubtotal = 0;
    const orderItemSnapshots: any[] = [];

    for (const item of items) {
      const prod = dbProducts.find((p) => p.id === item.productId);
      if (!prod || !prod.isActive || prod.isProhibited) {
        return res.status(400).json({ error: `Product "${prod?.name || 'Selected product'}" is unavailable` });
      }

      let effectivePrice = Number(prod.discountPrice && Number(prod.discountPrice) > 0 ? prod.discountPrice : prod.price);
      let variantName = '';

      if (item.variantId) {
        const vr = dbVariants.find((v) => v.id === item.variantId);
        if (vr) {
          effectivePrice = Number(vr.price);
          variantName = vr.name;
          // Stock check
          if (vr.stock < item.quantity) {
            return res.status(400).json({ error: `Insufficient stock for variant "${vr.name}" (only ${vr.stock} available)` });
          }
        }
      } else {
        if (prod.stockQuantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for "${prod.name}" (only ${prod.stockQuantity} available)` });
        }
      }

      const itemTotal = effectivePrice * item.quantity;
      calculatedSubtotal += itemTotal;

      orderItemSnapshots.push({
        productId: prod.id,
        variantId: item.variantId || null,
        productName: prod.name,
        variantName,
        unit: prod.unit,
        price: String(effectivePrice), // Permanent snapshot
        discount: '0',
        quantity: item.quantity,
        total: String(itemTotal),
      });
    }

    // Check minimum order amount
    const minOrder = Number(targetShop.minOrderAmount || 0);
    if (calculatedSubtotal < minOrder) {
      return res.status(400).json({
        error: `Minimum order amount for ${targetShop.name} is ₹${minOrder}. Please add more items.`,
      });
    }

    // Calculate delivery fee
    let calculatedDeliveryFee = 0;
    if (orderType === 'delivery') {
      const freeThreshold = Number(targetShop.freeDeliveryThreshold || 500);
      if (calculatedSubtotal < freeThreshold) {
        calculatedDeliveryFee = Number(targetShop.deliveryFee || 30);
      }
    }

    // Apply Coupon / Discount
    let calculatedDiscount = 0;
    if (couponCode) {
      const offer = await db
        .select()
        .from(offers)
        .where(and(eq(offers.shopId, shopId), eq(offers.code, couponCode), eq(offers.isActive, true)))
        .limit(1);

      if (offer.length > 0) {
        const off = offer[0];
        if (calculatedSubtotal >= Number(off.minOrderValue || 0)) {
          if (off.discountType === 'percentage') {
            calculatedDiscount = Math.round((calculatedSubtotal * Number(off.discountValue)) / 100);
          } else {
            calculatedDiscount = Number(off.discountValue);
          }
        }
      }
    }

    const calculatedTotal = Math.max(0, calculatedSubtotal + calculatedDeliveryFee - calculatedDiscount);

    // Generate unique order number and invoice number
    const orderNumber = `YUN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceNumber = `INV-YUNAY-${Date.now().toString().slice(-6)}`;

    // Create Order
    const [createdOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        shopId,
        userId,
        customerName: customerName || req.user?.name || 'Valued Customer',
        customerPhone: customerPhone || req.user?.phone || '+91 90000 00000',
        orderType: orderType || 'delivery',
        deliveryAddress: deliveryAddress || '',
        addressType: addressType || 'home',
        landmark: landmark || '',
        deliveryInstructions: deliveryInstructions || '',
        status: 'NEW',
        subtotal: String(calculatedSubtotal),
        discountAmount: String(calculatedDiscount),
        deliveryFee: String(calculatedDeliveryFee),
        taxAmount: '0',
        totalAmount: String(calculatedTotal),
        paymentMethod: paymentMethod || 'cash_on_delivery',
        paymentStatus: paymentMethod === 'upi_online' ? 'paid' : 'pending',
      })
      .returning();

    // Insert Order Items snapshots
    const itemsToInsert = orderItemSnapshots.map((item) => ({
      ...item,
      orderId: createdOrder.id,
    }));
    await db.insert(orderItems).values(itemsToInsert);

    // Auto Generate Invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        orderId: createdOrder.id,
        shopId,
        customNotes: `Generated automatically via YUNAY platform for ${targetShop.name}.`,
      })
      .returning();

    // Decrement stock in database
    for (const item of items) {
      if (item.variantId) {
        await db
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId));
      }
      await db
        .update(products)
        .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    // Clear user cart for this shop
    const userCart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (userCart.length > 0) {
      await db.delete(cartItems).where(eq(cartItems.cartId, userCart[0].id));
    }

    // Send notifications to Shopkeeper & Customer
    await db.insert(notifications).values([
      {
        userId: targetShop.ownerId,
        shopId: targetShop.id,
        title: 'New Order Received',
        message: `Order #${orderNumber} for ₹${calculatedTotal} placed by ${createdOrder.customerName}.`,
        type: 'order',
      },
      {
        userId,
        shopId: targetShop.id,
        title: 'Order Placed Successfully',
        message: `Your order #${orderNumber} at ${targetShop.name} has been placed.`,
        type: 'order',
      },
    ]);

    res.status(201).json({
      order: createdOrder,
      invoice,
    });
  } catch (error: any) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: error.message || 'Failed to place order' });
  }
});

// Get User Orders (Customer Order History)
apiRouter.get('/orders/my-orders', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.dbId!;
    const userOrders = await db
      .select({
        order: orders,
        shop: {
          id: shops.id,
          name: shops.name,
          slug: shops.slug,
          logoUrl: shops.logoUrl,
          businessPhone: shops.businessPhone,
        },
      })
      .from(orders)
      .innerJoin(shops, eq(orders.shopId, shops.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    // Get order items for each order
    const orderIds = userOrders.map((o) => o.order.id);
    let itemsList: any[] = [];
    if (orderIds.length > 0) {
      itemsList = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
    }

    const formatted = userOrders.map((o) => ({
      ...o.order,
      shop: o.shop,
      items: itemsList.filter((item) => item.orderId === o.order.id),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Order Details & Invoice (Customer / Merchant / Admin)
apiRouter.get('/orders/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const orderList = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (orderList.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = orderList[0];
    const shopList = await db.select().from(shops).where(eq(shops.id, order.shopId)).limit(1);
    const shop = shopList[0] || null;

    // Strict multi-tenant access control
    const isSuperAdmin = req.user?.role === 'super_admin' || req.dbUser?.role === 'super_admin';
    const isOrderOwner = Number(order.userId) === Number(req.user?.dbId || req.dbUser?.id);
    const isShopOwner = shop && Number(shop.ownerId) === Number(req.user?.dbId || req.dbUser?.id);

    if (!isSuperAdmin && !isOrderOwner && !isShopOwner) {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not authorized to view this order.' });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const invoiceList = await db.select().from(invoices).where(eq(invoices.orderId, id)).limit(1);

    res.json({
      order,
      shop,
      items,
      invoice: invoiceList[0] || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Order Status (Shopkeeper or Admin)
apiRouter.put('/orders/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, paymentStatus, customNotes } = req.body;

    const orderList = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (orderList.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = orderList[0];
    const shop = await db.select().from(shops).where(eq(shops.id, order.shopId)).limit(1);

    // Multi-tenant authorization
    const isSuperAdmin = req.user?.role === 'super_admin' || req.dbUser?.role === 'super_admin';
    const isShopOwner = shop.length > 0 && Number(shop[0].ownerId) === Number(req.user?.dbId || req.dbUser?.id);

    if (!isSuperAdmin && !isShopOwner) {
      return res.status(403).json({ error: 'Unauthorized to manage this order' });
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: status || order.status,
        paymentStatus: paymentStatus || order.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    // If cancelled or rejected, optionally restore stock
    if (status === 'CANCELLED' || status === 'REJECTED') {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
      for (const item of items) {
        if (item.productId) {
          await db
            .update(products)
            .set({ stockQuantity: sql`${products.stockQuantity} + ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
        if (item.variantId) {
          await db
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
            .where(eq(productVariants.id, item.variantId));
        }
      }
    }

    // Send notification to customer
    await db.insert(notifications).values({
      userId: order.userId,
      shopId: order.shopId,
      title: `Order Update: ${status}`,
      message: `Your order #${order.orderNumber} status changed to ${status}.`,
      type: 'order',
    });

    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder Previous Order
apiRouter.post('/orders/:id/reorder', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.dbId!;
    const orderId = parseInt(req.params.id, 10);

    const oldOrder = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (oldOrder.length === 0) return res.status(404).json({ error: 'Order not found' });

    const oldItems = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    // Clear cart and add available items
    let userCart = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (userCart.length > 0) {
      await db.delete(cartItems).where(eq(cartItems.cartId, userCart[0].id));
      await db.update(carts).set({ shopId: oldOrder[0].shopId }).where(eq(carts.id, userCart[0].id));
    } else {
      const [newCart] = await db.insert(carts).values({ userId, shopId: oldOrder[0].shopId }).returning();
      userCart = [newCart];
    }

    let addedCount = 0;
    for (const item of oldItems) {
      if (item.productId) {
        const prod = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (prod.length > 0 && prod[0].isActive && prod[0].stockQuantity >= item.quantity) {
          await db.insert(cartItems).values({
            cartId: userCart[0].id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          });
          addedCount++;
        }
      }
    }

    res.json({ success: true, addedCount, message: `${addedCount} items added to cart with current live prices` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 8. SHOPKEEPER DASHBOARD & ANALYTICS
// ==========================================

// Get Shop Orders with filtering
apiRouter.get('/shops/:id/orders', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.id, 10);
    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    if (req.user?.role !== 'super_admin' && Number(shop[0].ownerId) !== Number(req.user?.dbId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { status, search } = req.query;
    let query = db.select().from(orders).where(eq(orders.shopId, shopId));

    const shopOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.shopId, shopId),
          status && status !== 'ALL' ? eq(orders.status, String(status)) : undefined,
          search ? or(ilike(orders.orderNumber, `%${String(search)}%`), ilike(orders.customerName, `%${String(search)}%`)) : undefined
        )
      )
      .orderBy(desc(orders.createdAt));

    // Get order items
    const orderIds = shopOrders.map((o) => o.id);
    let itemsList: any[] = [];
    if (orderIds.length > 0) {
      itemsList = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
    }

    const formatted = shopOrders.map((o) => ({
      ...o,
      items: itemsList.filter((item) => item.orderId === o.id),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Shopkeeper Analytics
apiRouter.get('/shops/:id/analytics', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.id, 10);
    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    if (req.user?.role !== 'super_admin' && Number(shop[0].ownerId) !== Number(req.user?.dbId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Total orders & revenue
    const allOrders = await db.select().from(orders).where(eq(orders.shopId, shopId));
    const totalOrders = allOrders.length;
    const completedOrders = allOrders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED');
    const totalSales = completedOrders.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
    const averageOrderValue = completedOrders.length > 0 ? Math.round(totalSales / completedOrders.length) : 0;

    // Today's orders
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = allOrders.filter((o) => o.createdAt && o.createdAt.toISOString().startsWith(today));
    const todaySales = todayOrders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

    // Low stock items (< 10 units)
    const lowStockProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.shopId, shopId), eq(products.isActive, true), sql`${products.stockQuantity} <= 10`))
      .orderBy(products.stockQuantity)
      .limit(10);

    // Best selling products
    const bestSellers = await db
      .select({
        productName: orderItems.productName,
        totalSold: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(${orderItems.total})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.shopId, shopId), eq(orders.status, 'DELIVERED')))
      .groupBy(orderItems.productName)
      .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
      .limit(5);

    // Unique customers
    const uniqueCustomers = new Set(allOrders.map((o) => o.userId)).size;

    res.json({
      totalOrders,
      completedOrdersCount: completedOrders.length,
      cancelledOrdersCount: allOrders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED').length,
      totalSales,
      todayOrdersCount: todayOrders.length,
      todaySales,
      averageOrderValue,
      uniqueCustomers,
      lowStockProducts,
      bestSellers,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Shop Customer List
apiRouter.get('/shops/:id/customers', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.id, 10);
    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    if (req.user?.role !== 'super_admin' && Number(shop[0].ownerId) !== Number(req.user?.dbId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const customerAggregates = await db
      .select({
        userId: orders.userId,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        totalOrders: count(orders.id),
        totalSpend: sql<number>`SUM(${orders.totalAmount}::numeric)`,
        lastOrderDate: sql<string>`MAX(${orders.createdAt})`,
      })
      .from(orders)
      .where(eq(orders.shopId, shopId))
      .groupBy(orders.userId, orders.customerName, orders.customerPhone)
      .orderBy(sql`MAX(${orders.createdAt}) DESC`);

    res.json(customerAggregates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Shop Offers CRUD
apiRouter.get('/shops/:id/offers', async (req: Request, res: Response) => {
  try {
    const shopId = parseInt(req.params.id, 10);
    const list = await db.select().from(offers).where(eq(offers.shopId, shopId)).orderBy(desc(offers.createdAt));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/shops/:id/offers', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.id, 10);
    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    if (req.user?.role !== 'super_admin' && Number(shop[0].ownerId) !== Number(req.user?.dbId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { code, title, discountType, discountValue, minOrderValue, startDate, endDate } = req.body;
    const [newOffer] = await db
      .insert(offers)
      .values({
        shopId,
        code: String(code).toUpperCase().trim(),
        title,
        discountType: discountType || 'percentage',
        discountValue: String(discountValue),
        minOrderValue: String(minOrderValue || 0),
        startDate: startDate || '',
        endDate: endDate || '',
        isActive: true,
      })
      .returning();

    res.status(201).json(newOffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/shops/:shopId/offers/:offerId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shopId = parseInt(req.params.shopId, 10);
    const offerId = parseInt(req.params.offerId, 10);

    const shop = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shop.length === 0) return res.status(404).json({ error: 'Shop not found' });

    if (req.user?.role !== 'super_admin' && Number(shop[0].ownerId) !== Number(req.user?.dbId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.delete(offers).where(and(eq(offers.id, offerId), eq(offers.shopId, shopId)));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 9. SUPER ADMIN DASHBOARD & CONTROLS
// ==========================================

apiRouter.get('/admin/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin =
      req.user?.role === 'super_admin' ||
      req.dbUser?.role === 'super_admin';

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    // Platform-wide metrics
    const allShops = await db.select().from(shops);
    const allUsers = await db.select().from(users);
    const allOrders = await db.select().from(orders);

    const activeShops = allShops.filter((s) => s.status === 'active').length;
    const pendingShops = allShops.filter((s) => s.status === 'pending').length;
    const suspendedShops = allShops.filter((s) => s.status === 'suspended').length;

    const customers = allUsers.filter((u) => u.role === 'customer').length;
    const vendors = allUsers.filter((u) => u.role === 'shopkeeper').length;

    const completedOrders = allOrders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED');
    const cancelledOrders = allOrders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED');

    const totalPlatformSales = completedOrders.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

    const today = new Date().toISOString().split('T')[0];
    const todayOrders = allOrders.filter((o) => o.createdAt && o.createdAt.toISOString().startsWith(today));
    const todaySales = todayOrders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .reduce((acc, curr) => acc + Number(curr.totalAmount), 0);

    // Platform Commission (1% rate for platform owner)
    const commissionRate = 1.0;
    const totalPlatformCommission = Number(((totalPlatformSales * commissionRate) / 100).toFixed(2));
    const todayPlatformCommission = Number(((todaySales * commissionRate) / 100).toFixed(2));

    // Shop-wise sales summary
    const shopSalesMap: Record<number, { id: number; name: string; sales: number; ordersCount: number; commission: number; netPayout: number }> = {};
    for (const sh of allShops) {
      shopSalesMap[sh.id] = { id: sh.id, name: sh.name, sales: 0, ordersCount: 0, commission: 0, netPayout: 0 };
    }
    for (const ord of completedOrders) {
      if (shopSalesMap[ord.shopId]) {
        const amt = Number(ord.totalAmount);
        shopSalesMap[ord.shopId].sales += amt;
        shopSalesMap[ord.shopId].ordersCount += 1;
        shopSalesMap[ord.shopId].commission += Number(((amt * commissionRate) / 100).toFixed(2));
        shopSalesMap[ord.shopId].netPayout += Number(((amt * (100 - commissionRate)) / 100).toFixed(2));
      }
    }

    const shopSales = Object.values(shopSalesMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    for (const s of allShops) {
      categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
    }

    res.json({
      metrics: {
        totalShops: allShops.length,
        activeShops,
        pendingShops,
        suspendedShops,
        totalCustomers: customers,
        totalVendors: vendors,
        totalOrders: allOrders.length,
        todayOrders: todayOrders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalPlatformSales,
        todaySales,
        commissionRate,
        totalPlatformCommission,
        todayPlatformCommission,
      },
      shopSales,
      categoryDistribution: Object.entries(categoryCounts).map(([category, count]) => ({ category, count })),
      recentShops: allShops.slice(-5).reverse(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Super Admin: Shop Approval, Suspension, Management
apiRouter.put('/admin/shops/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin =
      req.user?.role === 'super_admin' ||
      req.dbUser?.role === 'super_admin';

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const shopId = parseInt(req.params.id, 10);
    const { status, reason } = req.body; // 'active', 'rejected', 'suspended'

    const [updated] = await db
      .update(shops)
      .set({ status })
      .where(eq(shops.id, shopId))
      .returning();

    // Log action
    await db.insert(adminLogs).values({
      adminId: req.user!.dbId!,
      action: `SHOP_STATUS_${status.toUpperCase()}`,
      targetType: 'shop',
      targetId: String(shopId),
      details: reason || `Shop status updated to ${status}`,
    });

    // Notify shop owner
    await db.insert(notifications).values({
      userId: updated.ownerId,
      shopId: updated.id,
      title: `Store Status Changed: ${status.toUpperCase()}`,
      message: `Your storefront status has been set to ${status} by YUNAY Super Admin. ${reason || ''}`,
      type: 'alert',
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Super Admin: Customer Management (View, Block, Unblock)
apiRouter.get('/admin/customers', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin' && req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const customerList = await db
      .select()
      .from(users)
      .where(eq(users.role, 'customer'))
      .orderBy(desc(users.createdAt));

    res.json(customerList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Super Admin: All Users Management (Shop Owners & Customers)
apiRouter.get('/admin/users', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin' && req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const allUsers = await db
      .select()
      .from(users)
      .where(sql`${users.role} != 'super_admin'`)
      .orderBy(desc(users.createdAt));

    const allShops = await db.select().from(shops);

    const enrichedUsers = allUsers.map((u) => {
      const userShop = allShops.find((s) => s.ownerId === u.id);
      return {
        ...u,
        shop: userShop || null,
      };
    });

    res.json(enrichedUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/admin/users/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const userId = parseInt(req.params.id, 10);
    const { status } = req.body; // 'active' | 'blocked'

    const [updated] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, userId))
      .returning();

    // Audit log
    await db.insert(adminLogs).values({
      adminId: req.user!.dbId!,
      action: `USER_${status.toUpperCase()}`,
      targetType: 'user',
      targetId: String(userId),
      details: `User status changed to ${status}`,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Super Admin: Permanently Delete / Remove a Shop
apiRouter.delete('/admin/shops/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin' && req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required to remove shops' });
    }

    const shopId = parseInt(req.params.id, 10);
    const shopList = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
    if (shopList.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    const targetShop = shopList[0];

    // 1. Delete reviews, support tickets, and notifications for this shop FIRST (they reference orders/shops)
    await db.delete(reviews).where(eq(reviews.shopId, shopId));
    await db.delete(supportTickets).where(eq(supportTickets.shopId, shopId));
    await db.delete(notifications).where(eq(notifications.shopId, shopId));
    await db.delete(offers).where(eq(offers.shopId, shopId));

    // 2. Delete cart items & carts for this shop
    const shopCarts = await db.select({ id: carts.id }).from(carts).where(eq(carts.shopId, shopId));
    if (shopCarts.length > 0) {
      const cartIds = shopCarts.map((c) => c.id);
      await db.delete(cartItems).where(inArray(cartItems.cartId, cartIds));
      await db.delete(carts).where(eq(carts.shopId, shopId));
    }

    // 3. Delete invoices, order items, and orders for this shop
    const shopOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.shopId, shopId));
    if (shopOrders.length > 0) {
      const orderIds = shopOrders.map((o) => o.id);
      await db.delete(invoices).where(inArray(invoices.orderId, orderIds));
      await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
      await db.delete(orders).where(eq(orders.shopId, shopId));
    }

    // 4. Delete product variants and products for this shop
    const shopProds = await db.select({ id: products.id }).from(products).where(eq(products.shopId, shopId));
    if (shopProds.length > 0) {
      const prodIds = shopProds.map((p) => p.id);
      await db.delete(productVariants).where(inArray(productVariants.productId, prodIds));
      await db.delete(products).where(eq(products.shopId, shopId));
    }

    // 5. Delete the shop record
    await db.delete(shops).where(eq(shops.id, shopId));

    // 6. Audit log
    await db.insert(adminLogs).values({
      adminId: req.dbUser?.id || req.user!.dbId || 1,
      action: 'DELETE_SHOP',
      targetType: 'shop',
      targetId: String(shopId),
      details: `Permanently removed store "${targetShop.name}" (#${shopId}) and all associated catalog/orders.`,
    });

    res.json({ success: true, message: `Store "${targetShop.name}" has been permanently removed.` });
  } catch (error: any) {
    console.error('Error deleting shop:', error);
    res.status(500).json({ error: error.message || 'Failed to remove shop' });
  }
});

// Super Admin: Permanently Delete / Remove a User (Shop Owner or Client)
apiRouter.delete('/admin/users/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin' && req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required to remove users' });
    }

    const userId = parseInt(req.params.id, 10);
    const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userList.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const targetUser = userList[0];

    if (targetUser.role === 'super_admin') {
      return res.status(400).json({ error: 'Cannot delete Super Admin account' });
    }

    // 1. If user owns shops (Shop Owner), delete all owned shops and their catalogs/orders
    const userShops = await db.select({ id: shops.id }).from(shops).where(eq(shops.ownerId, userId));
    for (const sh of userShops) {
      const shopId = sh.id;
      await db.delete(reviews).where(eq(reviews.shopId, shopId));
      await db.delete(supportTickets).where(eq(supportTickets.shopId, shopId));
      await db.delete(notifications).where(eq(notifications.shopId, shopId));
      await db.delete(offers).where(eq(offers.shopId, shopId));

      const shopCarts = await db.select({ id: carts.id }).from(carts).where(eq(carts.shopId, shopId));
      if (shopCarts.length > 0) {
        await db.delete(cartItems).where(inArray(cartItems.cartId, shopCarts.map((c) => c.id)));
        await db.delete(carts).where(eq(carts.shopId, shopId));
      }

      const shopOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.shopId, shopId));
      if (shopOrders.length > 0) {
        const orderIds = shopOrders.map((o) => o.id);
        await db.delete(invoices).where(inArray(invoices.orderId, orderIds));
        await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
        await db.delete(orders).where(eq(orders.shopId, shopId));
      }

      const shopProds = await db.select({ id: products.id }).from(products).where(eq(products.shopId, shopId));
      if (shopProds.length > 0) {
        await db.delete(productVariants).where(inArray(productVariants.productId, shopProds.map((p) => p.id)));
        await db.delete(products).where(eq(products.shopId, shopId));
      }

      await db.delete(shops).where(eq(shops.id, shopId));
    }

    // 2. Clean up user's own reviews, tickets, notifications
    await db.delete(reviews).where(eq(reviews.userId, userId));
    await db.delete(supportTickets).where(eq(supportTickets.userId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // 3. Clean up user's carts
    const userCarts = await db.select({ id: carts.id }).from(carts).where(eq(carts.userId, userId));
    if (userCarts.length > 0) {
      await db.delete(cartItems).where(inArray(cartItems.cartId, userCarts.map((c) => c.id)));
      await db.delete(carts).where(eq(carts.userId, userId));
    }

    // 4. Clean up any orders placed by this user (Client/Customer orders)
    const userPlacedOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, userId));
    if (userPlacedOrders.length > 0) {
      const orderIds = userPlacedOrders.map((o) => o.id);
      // Clean reviews & tickets pointing to these orders
      await db.delete(reviews).where(inArray(reviews.orderId, orderIds));
      await db.delete(supportTickets).where(inArray(supportTickets.orderId, orderIds));
      await db.delete(invoices).where(inArray(invoices.orderId, orderIds));
      await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
      await db.delete(orders).where(eq(orders.userId, userId));
    }

    // 5. Clean up admin logs where this user is adminId
    await db.delete(adminLogs).where(eq(adminLogs.adminId, userId));

    // 6. Finally delete the user record
    await db.delete(users).where(eq(users.id, userId));

    // Audit log
    await db.insert(adminLogs).values({
      adminId: req.dbUser?.id || req.user!.dbId || 1,
      action: 'DELETE_USER',
      targetType: 'user',
      targetId: String(userId),
      details: `Permanently removed user "${targetUser.name}" (${targetUser.email}, #${userId}) and related records.`,
    });

    res.json({ success: true, message: `User "${targetUser.name}" has been permanently removed.` });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message || 'Failed to remove user' });
  }
});

// Super Admin: Prohibit/Unprohibit Product
apiRouter.put('/admin/products/:id/prohibit', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const productId = parseInt(req.params.id, 10);
    const { isProhibited, reason } = req.body;

    const [updated] = await db
      .update(products)
      .set({ isProhibited: Boolean(isProhibited) })
      .where(eq(products.id, productId))
      .returning();

    await db.insert(adminLogs).values({
      adminId: req.user!.dbId!,
      action: isProhibited ? 'PROHIBIT_PRODUCT' : 'UNPROHIBIT_PRODUCT',
      targetType: 'product',
      targetId: String(productId),
      details: reason || 'Product prohibited from platform catalogue',
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Super Admin: Platform Settings
apiRouter.get('/admin/settings', async (_req: Request, res: Response) => {
  try {
    const list = await db.select().from(platformSettings);
    const settingsObj: Record<string, string> = {};
    for (const item of list) {
      settingsObj[item.key] = item.value;
    }
    if (!settingsObj['commission_rate']) {
      settingsObj['commission_rate'] = '1.0';
    }
    res.json(settingsObj);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/admin/settings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isSuperAdmin =
      req.user?.role === 'super_admin' ||
      req.dbUser?.role === 'super_admin';

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const settingsMap = req.body;
    for (const [key, value] of Object.entries(settingsMap)) {
      await db
        .insert(platformSettings)
        .values({ key, value: String(value) })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: { value: String(value), updatedAt: new Date() },
        });
    }

    await db.insert(adminLogs).values({
      adminId: req.user!.dbId!,
      action: 'UPDATE_PLATFORM_SETTINGS',
      targetType: 'setting',
      targetId: 'all',
      details: 'Super Admin updated platform configuration',
    });

    res.json({ success: true, message: 'Settings updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Audit Logs
apiRouter.get('/admin/logs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const logs = await db
      .select({
        id: adminLogs.id,
        action: adminLogs.action,
        targetType: adminLogs.targetType,
        targetId: adminLogs.targetId,
        details: adminLogs.details,
        createdAt: adminLogs.createdAt,
        adminName: users.name,
      })
      .from(adminLogs)
      .leftJoin(users, eq(adminLogs.adminId, users.id))
      .orderBy(desc(adminLogs.createdAt))
      .limit(50);

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 10. REVIEWS & RATINGS
// ==========================================

apiRouter.post('/reviews', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.dbId!;
    const { shopId, orderId, rating, comment } = req.body;

    if (!shopId || !rating) {
      return res.status(400).json({ error: 'Shop ID and rating are required' });
    }

    const [newReview] = await db
      .insert(reviews)
      .values({
        shopId,
        userId,
        orderId: orderId || null,
        rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
        comment: comment || '',
        isModerated: true,
      })
      .returning();

    res.status(201).json(newReview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 11. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.dbId!;
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/notifications/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 12. CUSTOMER SUPPORT TICKETS
// ==========================================

apiRouter.post('/support', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.dbId!;
    const { shopId, orderId, subject, message, category, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId,
        shopId: shopId || null,
        orderId: orderId || null,
        subject,
        message,
        category: category || 'General',
        priority: priority || 'normal',
        status: 'open',
      })
      .returning();

    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/support', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.dbId!;
    const isSuperAdmin = req.user?.role === 'super_admin';

    let query = db.select().from(supportTickets);
    if (!isSuperAdmin) {
      query = query.where(eq(supportTickets.userId, userId)) as any;
    }

    const tickets = await query.orderBy(desc(supportTickets.createdAt));
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/support/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required' });
    }

    const ticketId = parseInt(req.params.id, 10);
    const { status, adminNotes } = req.body;

    const [updated] = await db
      .update(supportTickets)
      .set({ status, adminNotes })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// STANDARDIZED API ERROR HANDLING MIDDLEWARE
// ==========================================
apiRouter.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err);

  // PostgreSQL / Database errors
  if (err.code && typeof err.code === 'string' && (err.code.startsWith('23') || err.code.startsWith('08') || err.code.startsWith('42'))) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'A record with this information already exists.',
        code: 'DUPLICATE_ENTRY',
      });
    }
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'Cannot complete operation due to linked records (foreign key constraint).',
        code: 'FOREIGN_KEY_VIOLATION',
      });
    }
    return res.status(500).json({
      error: 'A database error occurred. Please try again.',
      code: 'DATABASE_ERROR',
    });
  }

  // Authentication & Authorization errors
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      error: err.message || 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  }
  if (err.status === 403) {
    return res.status(403).json({
      error: err.message || 'Access denied',
      code: 'FORBIDDEN',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred',
    code: err.code || 'INTERNAL_ERROR',
  });
});

