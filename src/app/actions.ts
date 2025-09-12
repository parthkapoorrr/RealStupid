
'use server';

import { db } from '@/lib/db';
import { insertPostSchema, posts, users, postVotes } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { and, desc, eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/firebase';
import { getOrCreateUser } from './auth/actions';

export async function createPost(formData: FormData) {
  const rawValues = {
    userId: formData.get('userId') as string,
    title: formData.get('title') as string,
    community: formData.get('community') as string,
    content: (formData.get('content') as string) || undefined,
    link: (formData.get('link') as string) || undefined,
    mode: (formData.get('mode') as 'real' | 'stupid') || 'real',
  };

  const imageFile = formData.get('image') as File | null;
  
  if (imageFile && imageFile.size > 0) {
    // In a real app, you would upload this to a storage service like Firebase Storage or an S3 bucket.
    // For now, we'll just log that it's here and store a placeholder URL.
    console.log('Image received:', imageFile.name, imageFile.size, 'bytes');
    // Using picsum for a dynamic placeholder. The seed ensures the same image appears for the same post.
    const seed = Math.floor(Math.random() * 1000);
    rawValues.link = `https://picsum.photos/seed/${seed}/800/600`;
  }

  // Only include fields that are in the schema for validation
  const valuesToValidate = {
    userId: rawValues.userId,
    title: rawValues.title,
    community: rawValues.community,
    content: rawValues.content,
    link: rawValues.link,
    mode: rawValues.mode,
  }

  const validatedPost = insertPostSchema.parse(valuesToValidate);

  try {
    await db.insert(posts).values(validatedPost);
    revalidatePath('/real');
    revalidatePath('/stupid');
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save post to the database.');
  }
}

export async function getPosts(mode: 'real' | 'stupid', userId?: string | null) {
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
        mode: posts.mode,
        author: {
          name: users.displayName,
          avatarUrl: users.photoURL,
        },
        userVote: userId ? postVotes.voteType : sql`null`.as('user_vote'),
        // In a real app, you would calculate this with a subquery or a separate table
        commentsCount: 0,
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(postVotes, and(eq(postVotes.postId, posts.id), userId ? eq(postVotes.userId, userId) : sql`false`))
      .where(eq(posts.mode, mode))
      .orderBy(desc(posts.createdAt));

    return allPosts.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      id: String(p.id),
    }));
  } catch (error) {
    console.error('Database error fetching posts:', error);
    return [];
  }
}

export async function getPostById(postId: number, userId?: string | null) {
  try {
    const results = await db.select({
        post: posts,
        user: users,
        userVote: userId ? postVotes.voteType : sql`null`.as('user_vote'),
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .leftJoin(users, eq(posts.userId, users.id))
    .leftJoin(postVotes, and(eq(postVotes.postId, posts.id), userId ? eq(postVotes.userId, userId) : sql`false`));
    
    if (results.length === 0 || !results[0].post || !results[0].user) {
        return null;
    }

    const { post, user, userVote } = results[0];

    // Remap to match the Post type structure used in components
    return {
      id: String(post.id),
      title: post.title,
      content: post.content ?? undefined,
      link: post.link ?? undefined,
      author: {
        name: user.displayName || 'Unknown User',
        avatarUrl: user.photoURL || undefined
      },
      community: post.community,
      createdAt: new Date(post.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      userVote: userVote,
      commentsCount: 0, // Placeholder
      mode: post.mode,
    };
  } catch (error) {
    console.error('Database error fetching post by ID:', error);
    return null;
  }
}

export async function updateVote(postId: number, voteType: 'up' | 'down', userId: string) {
    if (!userId) {
        throw new Error("User must be logged in to vote.");
    }
    
    try {
        await db.transaction(async (tx) => {
            const existingVote = await tx.query.postVotes.findFirst({
                where: and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)),
            });

            if (existingVote) {
                if (existingVote.voteType === voteType) {
                    // User is clicking the same button again, so un-vote
                    await tx.delete(postVotes).where(
                        and(eq(postVotes.postId, postId), eq(postVotes.userId, userId))
                    );
                    // Decrement the corresponding vote count
                    const fieldToDecrement = voteType === 'up' ? posts.upvotes : posts.downvotes;
                    await tx.update(posts)
                        .set({ [voteType === 'up' ? 'upvotes' : 'downvotes']: sql`${fieldToDecrement} - 1` })
                        .where(eq(posts.id, postId));

                } else {
                    // User is changing their vote
                    await tx.update(postVotes)
                        .set({ voteType: voteType })
                        .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));
                    
                    // Decrement old vote count, increment new vote count
                    const fieldToDecrement = existingVote.voteType === 'up' ? posts.upvotes : posts.downvotes;
                    const fieldToIncrement = voteType === 'up' ? posts.upvotes : posts.downvotes;
                    await tx.update(posts)
                        .set({ 
                            [existingVote.voteType === 'up' ? 'upvotes' : 'downvotes']: sql`${fieldToDecrement} - 1`,
                            [voteType === 'up' ? 'upvotes' : 'downvotes']: sql`${fieldToIncrement} + 1` 
                        })
                        .where(eq(posts.id, postId));
                }
            } else {
                // New vote
                await tx.insert(postVotes).values({
                    postId,
                    userId,
                    voteType,
                });
                 // Increment the corresponding vote count
                 const fieldToIncrement = voteType === 'up' ? posts.upvotes : posts.downvotes;
                 await tx.update(posts)
                     .set({ [voteType === 'up' ? 'upvotes' : 'downvotes']: sql`${fieldToIncrement} + 1` })
                     .where(eq(posts.id, postId));
            }
        });
        
        // Revalidate paths to update the UI
        revalidatePath('/');
        revalidatePath('/real');
        revalidatePath('/stupid');
        revalidatePath(`/post/${postId}`);

    } catch(error) {
        console.error("Failed to update vote", error);
        throw new Error("Could not update vote count.");
    }
}
