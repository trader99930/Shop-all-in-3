import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users, shops, orders } from '../db/schema.ts';
import { eq, or, ilike } from 'drizzle-orm';

export interface AuthUser {
  uid: string;
  dbId: number;
  role: 'super_admin' | 'shopkeeper' | 'customer' | string;
  email?: string;
  name?: string;
  phone?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  dbUser?: typeof users.$inferSelect;
  shop?: typeof shops.$inferSelect;
  order?: typeof orders.$inferSelect;
}

const JWT_SECRET = process.env.JWT_SECRET || 'yunay-production-jwt-secret-key-2026-secure';

// Mint a tamper-proof session token for authenticated user sessions
export function signSessionToken(payload: { uid: string; dbId: number; role: string; email?: string; name?: string }) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days expiration
  const body = Buffer.from(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

// Verify a tamper-proof session token
export function verifySessionToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      uid: data.uid,
      dbId: data.dbId,
      role: data.role,
      email: data.email,
      name: data.name,
    };
  } catch {
    return null;
  }
}

// Resolve authenticated user from Bearer token or session headers
async function resolveAuthUser(req: Request): Promise<typeof users.$inferSelect | null> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (token) {
      // 1. Try server-signed session token
      const sessionUser = verifySessionToken(token);
      if (sessionUser) {
        const found = await db
          .select()
          .from(users)
          .where(or(eq(users.id, sessionUser.dbId), eq(users.uid, sessionUser.uid)))
          .limit(1);
        if (found.length > 0) {
          return found[0];
        }
      }

      // 2. Try Firebase ID token verification
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        if (decoded && decoded.uid) {
          // Find user by Firebase UID or email
          let dbUserFound = await db.select().from(users).where(eq(users.uid, decoded.uid)).limit(1);
          let user = dbUserFound[0];

          if (!user && decoded.email) {
            const byEmail = await db
              .select()
              .from(users)
              .where(ilike(users.email, decoded.email.trim().toLowerCase()))
              .limit(1);
            if (byEmail.length > 0) {
              user = byEmail[0];
              // Link Firebase UID
              await db.update(users).set({ uid: decoded.uid }).where(eq(users.id, user.id));
            }
          }

          // Auto-create new user if this is a first-time Firebase sign-in
          if (!user) {
            const [newUser] = await db
              .insert(users)
              .values({
                uid: decoded.uid,
                email: decoded.email || `${decoded.uid}@yunay.in`,
                name: decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'YUNAY Customer'),
                phone: decoded.phone_number || '',
                role: 'customer',
                status: 'active',
                avatarUrl: decoded.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              })
              .returning();
            user = newUser;
          }

          return user;
        }
      } catch (err: any) {
        // Firebase verification failed
      }
    }
  }

  // 3. Fallback: Lookup by x-yunay-uid header if provided
  const yunayUid = req.headers['x-yunay-uid'] as string;
  if (yunayUid && typeof yunayUid === 'string' && yunayUid.trim()) {
    const cleanUid = yunayUid.trim();
    const found = await db.select().from(users).where(eq(users.uid, cleanUid)).limit(1);
    if (found.length > 0) {
      return found[0];
    }
  }

  return null;
}

// 1. Core Authentication Middleware
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid authentication session or token required',
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        error: 'AccountBlocked',
        message: 'Your account has been suspended by administration. Please contact support.',
      });
    }

    req.dbUser = user;
    req.user = {
      uid: user.uid,
      dbId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      phone: user.phone,
    };

    next();
  } catch (error: any) {
    console.error('requireAuth error:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
};

// 2. Optional Authentication Middleware (for public discovery / optionally enriched)
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const user = await resolveAuthUser(req);
    if (user && user.status !== 'blocked') {
      req.dbUser = user;
      req.user = {
        uid: user.uid,
        dbId: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      };
    }
  } catch {
    // Ignore error in optional auth
  }
  next();
};

// 3. Super Admin Gate
export const requireSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Super Admin privileges required to access platform governance controls',
      });
    }
    next();
  });
};

// 4. Shop Owner Gate (allows shopkeeper or super_admin)
export const requireShopOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.dbUser?.role !== 'shopkeeper' && req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Shop Owner privileges required to manage digital storefront',
      });
    }
    next();
  });
};

// 5. Customer Gate (allows customer or super_admin)
export const requireCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.dbUser?.role !== 'customer' && req.dbUser?.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Customer privileges required',
      });
    }
    next();
  });
};

// 6. Multi-Tenant Shop Access Enforcement
export const requireShopAccess = (shopIdParam: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, async () => {
      try {
        const rawParam = req.params[shopIdParam];
        const shopId = parseInt(rawParam, 10);

        if (isNaN(shopId)) {
          return res.status(400).json({ error: 'Invalid shop ID provided' });
        }

        const found = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
        if (found.length === 0) {
          return res.status(404).json({ error: 'Shop not found' });
        }

        const shop = found[0];

        // Super Admin can inspect/manage any shop
        if (req.dbUser?.role === 'super_admin') {
          req.shop = shop;
          return next();
        }

        // Shopkeeper must be the verified owner
        if (req.dbUser?.role === 'shopkeeper' && shop.ownerId === req.dbUser.id) {
          req.shop = shop;
          return next();
        }

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access Denied: You do not have authorization to manage this shop',
        });
      } catch (err: any) {
        console.error('requireShopAccess error:', err);
        res.status(500).json({ error: 'Error validating shop authorization' });
      }
    });
  };
};

// 7. Multi-Tenant Order Access Enforcement
export const requireOrderAccess = (orderIdParam: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    requireAuth(req, res, async () => {
      try {
        const orderId = parseInt(req.params[orderIdParam], 10);
        if (isNaN(orderId)) {
          return res.status(400).json({ error: 'Invalid order ID provided' });
        }

        const found = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (found.length === 0) {
          return res.status(404).json({ error: 'Order not found' });
        }

        const order = found[0];

        // 1. Super Admin access
        if (req.dbUser?.role === 'super_admin') {
          req.order = order;
          return next();
        }

        // 2. Customer access (only if this customer placed the order)
        if (order.userId === req.dbUser?.id) {
          req.order = order;
          return next();
        }

        // 3. Shopkeeper access (only if the order was placed at their shop)
        if (req.dbUser?.role === 'shopkeeper') {
          const shop = await db.select().from(shops).where(eq(shops.id, order.shopId)).limit(1);
          if (shop.length > 0 && shop[0].ownerId === req.dbUser.id) {
            req.order = order;
            return next();
          }
        }

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access Denied: You are not authorized to view or modify this order',
        });
      } catch (err: any) {
        console.error('requireOrderAccess error:', err);
        res.status(500).json({ error: 'Error validating order authorization' });
      }
    });
  };
};
