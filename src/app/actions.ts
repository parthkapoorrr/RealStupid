'use server';

import { db } from '@/lib/db';
import { insertPostSchema, posts } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const values = {
    userId: formData.get('userId') as string,
    title: formData.get('title') as string,
    community: formData.get('community') as string,
    content: (formData.get('content') as string) || undefined,
    link: (formData.get('link') as string) || undefined,
  };

  const imageFile = formData.get('image') as File | null;
  
  if (imageFile && imageFile.size > 0) {
    // In a real app, you would upload this to a storage service like Firebase Storage or an S3 bucket.
    // For now, we'll just log that it's here and store a placeholder URL.
    console.log('Image received:', imageFile.name, imageFile.size, 'bytes');
    values.link = `/uploads/placeholder.png`; // Placeholder link
  }


  const validatedPost = insertPostSchema.parse(values);

  try {
    await db.insert(posts).values(validatedPost);
    revalidatePath('/real');
    revalidatePath('/stupid');
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save post to the database.');
  }
}
