'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  displayName: string | null,
  email: string | null,
  photoURL: string | null
) {
  if (!email) {
    throw new Error('Email is required to create a user.');
  }
  
  // Check if user exists in our DB
  let dbUser = await db.query.users.findFirst({
    where: eq(users.id, uid),
  });

  // If not, create them
  if (!dbUser) {
    const newUser = {
      id: uid,
      displayName: displayName,
      email: email,
      photoURL: photoURL,
    };
    try {
        await db.insert(users).values(newUser);
        dbUser = { ...newUser, createdAt: new Date() };
    } catch(error) {
        console.error("Error creating user", error)
        // It's possible the user was created in another request, so we try fetching again.
        dbUser = await db.query.users.findFirst({
            where: eq(users.id, uid),
        });
        if (!dbUser) {
            throw new Error("Failed to create or find user after insert attempt.");
        }
    }
  }

  return dbUser;
}
