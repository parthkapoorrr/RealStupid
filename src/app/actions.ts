
'use server';

import { db } from '@/lib/db';
import { insertPostSchema, posts, users, postVotes, comments, insertCommentSchema, communities, insertCommunitySchema } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

export async function createPost(formData: FormData) {
  const imageFile = formData.get('image') as File | null;
  
  const rawValues = {
    userId: formData.get('userId') as string,
    title: formData.get('title') as string,
    community: formData.get('community') as string,
    content: (formData.get('content') as string) || undefined,
    link: (formData.get('link') as string) || undefined,
    imageUrl: undefined as string | undefined, // Initialize imageUrl as undefined
    mode: (formData.get('mode') as 'real' | 'stupid') || 'real',
  };

  if (imageFile && imageFile.size > 0) {
    // In a real app, you'd upload this to a storage bucket (e.g., S3, Firebase Storage)
    // For now, we'll use a placeholder.
    const seed = Math.floor(Math.random() * 1000);
    rawValues.imageUrl = `https://picsum.photos/seed/${seed}/800/600`;
    rawValues.link = undefined; // Ensure link is not set when image is present
  }
  
  const validatedPost = insertPostSchema.parse(rawValues);

  try {
    await db.insert(posts).values(validatedPost);
    revalidatePath('/real');
    revalidatePath('/stupid');
    revalidatePath(`/real/c/${validatedPost.community}`);
    revalidatePath(`/stupid/c/${validatedPost.community}`);
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save post to the database.');
  }
}

export async function getPosts(mode: 'real' | 'stupid', userId?: string | null) {
  try {
     const commentCountSubquery = db
      .select({
        postId: comments.postId,
        count: sql<number>`count(*)`.as('comment_count'),
      })
      .from(comments)
      .groupBy(comments.postId)
      .as('comment_counts');

    const allPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        link: posts.link,
        imageUrl: posts.imageUrl,
        community: posts.community,
        createdAt: posts.createdAt,
        upvotes: posts.upvotes,
        downvotes: posts.downvotes,
        mode: posts.mode,
        authorName: users.displayName,
        authorAvatar: users.photoURL,
        userVote: userId ? postVotes.voteType : sql`null`.as('user_vote'),
        commentsCount: sql<number>`coalesce(${commentCountSubquery.count}, 0)`.mapWith(Number),
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(postVotes, and(eq(postVotes.postId, posts.id), userId ? eq(postVotes.userId, userId) : sql`false`))
      .leftJoin(commentCountSubquery, eq(posts.id, commentCountSubquery.postId))
      .where(eq(posts.mode, mode))
      .orderBy(desc(posts.createdAt));

    return allPosts.map(p => ({
      id: String(p.id),
      title: p.title,
      content: p.content || undefined,
      link: p.link || undefined,
      imageUrl: p.imageUrl || undefined,
      community: p.community,
      createdAt: new Date(p.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      upvotes: p.upvotes,
      downvotes: p.downvotes,
      mode: p.mode as 'real' | 'stupid',
      author: {
        name: p.authorName || 'Unknown User',
        avatarUrl: p.authorAvatar,
      },
      userVote: p.userVote,
      commentsCount: p.commentsCount,
    }));
  } catch (error) {
    console.error('Database error fetching posts:', error);
    return [];
  }
}

export async function getPostById(postId: number, userId?: string | null) {
  try {
    const commentCountSubquery = db
    .select({
      postId: comments.postId,
      count: sql<number>`count(*)`.as('comment_count'),
    })
    .from(comments)
    .groupBy(comments.postId)
    .as('comment_counts');

    const results = await db.select({
        post: posts,
        user: users,
        userVote: userId ? postVotes.voteType : sql`null`.as('user_vote'),
        commentsCount: sql<number>`coalesce(${commentCountSubquery.count}, 0)`.mapWith(Number),
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .leftJoin(users, eq(posts.userId, users.id))
    .leftJoin(postVotes, and(eq(postVotes.postId, posts.id), userId ? eq(postVotes.userId, userId) : sql`false`))
    .leftJoin(commentCountSubquery, eq(posts.id, commentCountSubquery.postId));

    
    if (results.length === 0 || !results[0].post) {
        return null;
    }

    const { post, user, userVote, commentsCount } = results[0];

    return {
      id: String(post.id),
      title: post.title,
      content: post.content ?? undefined,
      link: post.link ?? undefined,
      imageUrl: post.imageUrl ?? undefined,
      author: {
        name: user?.displayName || 'Unknown User',
        avatarUrl: user?.photoURL || undefined
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
      commentsCount: commentsCount,
      mode: post.mode as 'real' | 'stupid',
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
                    const fieldToDecrement = voteType === 'up' ? posts.upvotes : posts.downvotes;
                    await tx.update(posts)
                        .set({ [voteType === 'up' ? 'upvotes' : 'downvotes']: sql`${fieldToDecrement} - 1` })
                        .where(eq(posts.id, postId));

                } else {
                    // User is changing their vote
                    await tx.update(postVotes)
                        .set({ voteType: voteType })
                        .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));
                    
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
                 const fieldToIncrement = voteType === 'up' ? posts.upvotes : posts.downvotes;
                 await tx.update(posts)
                     .set({ [voteType === 'up' ? 'upvotes' : 'downvotes']: sql`${fieldToIncrement} + 1` })
                     .where(eq(posts.id, postId));
            }
        });
        
        revalidatePath('/');
        revalidatePath('/real');
        revalidatePath('/stupid');
        revalidatePath(`/post/${postId}`);

    } catch(error) {
        console.error("Failed to update vote", error);
        throw new Error("Could not update vote count.");
    }
}

export async function createComment(formData: FormData) {
  const rawValues = {
    content: formData.get('content') as string,
    userId: formData.get('userId') as string,
    postId: Number(formData.get('postId')),
  };

  const validatedComment = insertCommentSchema.parse(rawValues);

  try {
    await db.insert(comments).values(validatedComment);
    revalidatePath(`/post/${rawValues.postId}`);
  } catch (error) {
    console.error('Database error creating comment:', error);
    throw new Error('Failed to save comment to the database.');
  }
}

export async function getComments(postId: number) {
  try {
    const allComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        authorName: users.displayName,
        authorAvatar: users.photoURL,
        postId: comments.postId,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return allComments.map(c => ({
      id: String(c.id),
      content: c.content,
      createdAt: new Date(c.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      author: {
        name: c.authorName || 'Unknown User',
        avatarUrl: c.authorAvatar || undefined,
      },
      postId: String(c.postId),
      upvotes: 0, // Not implemented
      downvotes: 0, // Not implemented
    }));
  } catch (error) {
    console.error('Database error fetching comments:', error);
    return [];
  }
}

const createCommunitySchema = z.object({
  name: z.string().min(3).max(21).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores are allowed."),
  creatorId: z.string(),
  mode: z.enum(['real', 'stupid']),
});

export async function createCommunity(formData: FormData) {
  const rawValues = {
    name: formData.get('communityName') as string,
    creatorId: formData.get('creatorId') as string,
    mode: formData.get('mode') as 'real' | 'stupid',
  };

  const validatedCommunity = createCommunitySchema.parse(rawValues);

  try {
    await db.insert(communities).values(validatedCommunity);
    revalidatePath('/'); // Revalidate home to update community lists
    return { success: true, name: validatedCommunity.name };
  } catch (error) {
    console.error('Database error creating community:', error);
    // Check for unique constraint violation
    if ((error as any)?.code === '23505') {
      return { success: false, message: 'Community name already exists.' };
    }
    return { success: false, message: 'Failed to create community.' };
  }
}

export async function getCommunities() {
  try {
    const allCommunities = await db.select().from(communities).orderBy(desc(communities.createdAt));
    return allCommunities;
  } catch (error) {
    console.error('Database error fetching communities:', error);
    return [];
  }
}

export async function getPostsByCommunity(communityName: string, mode: 'real' | 'stupid', userId?: string | null) {
  try {
    const commentCountSubquery = db
     .select({
       postId: comments.postId,
       count: sql<number>`count(*)`.as('comment_count'),
     })
     .from(comments)
     .groupBy(comments.postId)
     .as('comment_counts');

   const allPosts = await db
     .select({
       id: posts.id,
       title: posts.title,
       content: posts.content,
       link: posts.link,
       imageUrl: posts.imageUrl,
       community: posts.community,
       createdAt: posts.createdAt,
       upvotes: posts.upvotes,
       downvotes: posts.downvotes,
       mode: posts.mode,
       authorName: users.displayName,
       authorAvatar: users.photoURL,
       userVote: userId ? postVotes.voteType : sql`null`.as('user_vote'),
       commentsCount: sql<number>`coalesce(${commentCountSubquery.count}, 0)`.mapWith(Number),
     })
     .from(posts)
     .leftJoin(users, eq(posts.userId, users.id))
     .leftJoin(postVotes, and(eq(postVotes.postId, posts.id), userId ? eq(postVotes.userId, userId) : sql`false`))
     .leftJoin(commentCountSubquery, eq(posts.id, commentCountSubquery.postId))
     .where(and(eq(posts.mode, mode), eq(posts.community, communityName)))
     .orderBy(desc(posts.createdAt));

   return allPosts.map(p => ({
     id: String(p.id),
     title: p.title,
     content: p.content || undefined,
     link: p.link || undefined,
     imageUrl: p.imageUrl || undefined,
     community: p.community,
     createdAt: new Date(p.createdAt).toLocaleDateString('en-US', {
       month: 'short',
       day: 'numeric',
       year: 'numeric',
     }),
     upvotes: p.upvotes,
     downvotes: p.downvotes,
     mode: p.mode as 'real' | 'stupid',
     author: {
       name: p.authorName || 'Unknown User',
       avatarUrl: p.authorAvatar,
     },
     userVote: p.userVote,
     commentsCount: p.commentsCount,
   }));
 } catch (error) {
   console.error('Database error fetching posts by community:', error);
   return [];
 }
}

    