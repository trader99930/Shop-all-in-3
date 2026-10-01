import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, role: string = 'customer') {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    const [newUser] = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        role,
        status: 'active',
      })
      .returning();

    return newUser;
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const res = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
