
'use server';

import { db } from '@/lib/db';
import { insertPostSchema, posts, users, postVotes, comments, insertCommentSchema } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { and, desc, eq, sql } from 'drizzle-orm';
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
  
  // Create a mutable copy for validation
  const valuesToValidate = { ...rawValues };

  if (imageFile && imageFile.size > 0) {
    console.log('Image received:', imageFile.name, imageFile.size, 'bytes');
    const seed = Math.floor(Math.random() * 1000);
    // IMPORTANT: Update the link in the object that will be validated
    valuesToValidate.link = `https://picsum.photos/seed/${seed}/800/600`;
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
