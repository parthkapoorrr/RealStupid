'use server';

import { db } from '@/lib/db';
import { insertPostSchema, posts, users } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { desc, eq, sql } from 'drizzle-orm';

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
    // Using picsum for a dynamic placeholder. The seed ensures the same image appears for the same post.
    const seed = Math.floor(Math.random() * 1000);
    values.link = `https://picsum.photos/seed/${seed}/800/600`;
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
    const allPosts = await db
      .select({
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
          avatarUrl: users.photoURL,
        },
        // In a real app, you would calculate this with a subquery or a separate table
        commentsCount: 0,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));

    return allPosts.map(p => ({
      ...p,
      // Formatting date for display
      createdAt: new Date(p.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      // Ensure id is a string for consistency with mock data and component props
      id: String(p.id),
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


export async function updateVote(postId: number, voteType: 'up' | 'down') {
    try {
        const fieldToIncrement = voteType === 'up' ? posts.upvotes : posts.downvotes;
        await db.update(posts)
            .set({ [voteType === 'up' ? 'upvotes' : 'downvotes']: sql`${fieldToIncrement} + 1` })
            .where(eq(posts.id, postId));

        revalidatePath('/');
        revalidatePath('/real');
        revalidatePath('/stupid');
        revalidatePath(`/post/[id]`);
    } catch(error) {
        console.error("Failed to update vote", error);
        throw new Error("Could not update vote count.");
    }
}
