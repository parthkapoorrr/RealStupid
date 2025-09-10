'use server';

import { db } from '@/lib/db';
import { insertPostSchema, posts, users } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { desc } from 'drizzle-orm';

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

export async function getPosts() {
  try {
    const allPosts = await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      link: posts.link,
      community: posts.community,
      createdAt: posts.createdAt,
      upvotes: posts.upvotes,
      downvotes: posts.downvotes,
      author: {
        name: users.displayName,
        avatarUrl: users.photoURL
      },
      // In a real app, you would calculate this with a subquery or a separate table
      commentsCount: 0 
    })
    .from(posts)
    .leftJoin(users, (posts.userId, users.id))
    .orderBy(desc(posts.createdAt));
    
    // Drizzle returns a weird nested object, let's flatten it.
    // This is a known behavior that might be improved in future Drizzle versions.
    return allPosts.map(p => ({
      ...p.posts,
      author: p.users,
      // Formatting date for display
      createdAt: new Date(p.posts.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      commentsCount: p.commentsCount,
      // Ensure id is a string for consistency with mock data and component props
      id: String(p.posts.id)
    }));

  } catch (error) {
    console.error('Database error fetching posts:', error);
    return [];
  }
}

export async function getPostById(postId: number) {
  try {
    const post = await db.query.posts.findFirst({
        where: (posts, { eq }) => eq(posts.id, postId),
        with: {
            user: {
                columns: {
                    displayName: true,
                    photoURL: true,
                }
            }
        }
    });

    if (!post) {
      return null;
    }

    // Remap to match the Post type structure used in components
    return {
      id: String(post.id),
      title: post.title,
      content: post.content ?? undefined,
      link: post.link ?? undefined,
      author: {
        name: post.user.displayName || 'Unknown User',
        avatarUrl: post.user.photoURL || undefined
      },
      community: post.community,
      createdAt: new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      commentsCount: 0, // Placeholder
    };
  } catch (error) {
    console.error('Database error fetching post by ID:', error);
    return null;
  }
}