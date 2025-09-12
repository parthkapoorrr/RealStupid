
'use server';

import { db } from '@/lib/db';
import { insertPostSchema, posts, users, postVotes, comments, insertCommentSchema, communities, insertCommunitySchema, voteTypeEnum } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

export async function createPost(formData: FormData) {
  const rawValues = {
    userId: formData.get('userId') as string,
    title: formData.get('title') as string,
    community: formData.get('community') as string,
    content: (formData.get('content') as string) || undefined,
    link: (formData.get('link') as string) || undefined,
    mode: (formData.get('mode') as 'real' | 'stupid') || 'real',
  };
  
  const validatedPost = insertPostSchema.omit({imageUrl: true}).parse(rawValues);

  try {
    await db.insert(posts).values(validatedPost);
    revalidatePath(`/${validatedPost.mode}`);
    revalidatePath(`/${validatedPost.mode}/c/${validatedPost.community}`);
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

    const userVoteSubquery = userId ? db
      .select({
        postId: postVotes.postId,
        voteType: postVotes.voteType,
      })
      .from(postVotes)
      .where(eq(postVotes.userId, userId))
      .as('user_votes') : null;

    let query = db
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
        userVote: userId && userVoteSubquery ? userVoteSubquery.voteType : sql`null`.as('user_vote'),
        commentsCount: sql<number>`coalesce(${commentCountSubquery.count}, 0)`.mapWith(Number),
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .leftJoin(commentCountSubquery, eq(posts.id, commentCountSubquery.postId))
      .$dynamic();
      
      if (userId && userVoteSubquery) {
        query = query.leftJoin(userVoteSubquery, eq(posts.id, userVoteSubquery.postId));
      }
      
      const allPosts = await query.where(eq(posts.mode, mode))
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
      userVote: p.userVote as 'up' | 'down' | null,
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

    const userVoteSubquery = userId ? db
      .select({
        postId: postVotes.postId,
        voteType: postVotes.voteType,
      })
      .from(postVotes)
      .where(and(eq(postVotes.userId, userId), eq(postVotes.postId, postId)))
      .as('user_votes') : null;

    let query = db.select({
        post: posts,
        user: users,
        userVote: userId && userVoteSubquery ? userVoteSubquery.voteType : sql`null`.as('user_vote'),
        commentsCount: sql<number>`coalesce(${commentCountSubquery.count}, 0)`.mapWith(Number),
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .leftJoin(users, eq(posts.userId, users.id))
    .leftJoin(commentCountSubquery, eq(posts.id, commentCountSubquery.postId))
    .$dynamic();

    if (userId && userVoteSubquery) {
      query = query.leftJoin(userVoteSubquery, eq(posts.id, userVoteSubquery.postId));
    }

    const results = await query;
    
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
      userVote: userVote as 'up' | 'down' | null,
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
                    
                    if (voteType === 'up') {
                        await tx.update(posts).set({ upvotes: sql`${posts.upvotes} - 1` }).where(eq(posts.id, postId));
                    } else {
                        await tx.update(posts).set({ downvotes: sql`${posts.downvotes} - 1` }).where(eq(posts.id, postId));
                    }

                } else {
                    // User is changing their vote
                    await tx.update(postVotes)
                        .set({ voteType: voteType })
                        .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));
                    
                    if (voteType === 'up') { // old vote was down
                        await tx.update(posts)
                            .set({ 
                                upvotes: sql`${posts.upvotes} + 1`,
                                downvotes: sql`${posts.downvotes} - 1`
                            })
                            .where(eq(posts.id, postId));
                    } else { // old vote was up
                        await tx.update(posts)
                            .set({ 
                                upvotes: sql`${posts.upvotes} - 1`,
                                downvotes: sql`${posts.downvotes} + 1`
                            })
                            .where(eq(posts.id, postId));
                    }
                }
            } else {
                // New vote
                await tx.insert(postVotes).values({
                    postId,
                    userId,
                    voteType,
                });

                 if (voteType === 'up') {
                     await tx.update(posts).set({ upvotes: sql`${posts.upvotes} + 1` }).where(eq(posts.id, postId));
                 } else {
                     await tx.update(posts).set({ downvotes: sql`${posts.downvotes} + 1` }).where(eq(posts.id, postId));
                 }
            }
        });
        
        const post = await db.query.posts.findFirst({where: eq(posts.id, postId)});
        revalidatePath('/');
        revalidatePath(`/${post?.mode}`);
        revalidatePath(`/${post?.mode}/c/${post?.community}`);
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

    const userVoteSubquery = userId ? db
      .select({
        postId: postVotes.postId,
        voteType: postVotes.voteType,
      })
      .from(postVotes)
      .where(eq(postVotes.userId, userId))
      .as('user_votes') : null;

   let query = db
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
       userVote: userId && userVoteSubquery ? userVoteSubquery.voteType : sql`null`.as('user_vote'),
       commentsCount: sql<number>`coalesce(${commentCountSubquery.count}, 0)`.mapWith(Number),
     })
     .from(posts)
     .leftJoin(users, eq(posts.userId, users.id))
     .leftJoin(commentCountSubquery, eq(posts.id, commentCountSubquery.postId))
     .$dynamic();

    if (userId && userVoteSubquery) {
      query = query.leftJoin(userVoteSubquery, eq(posts.id, userVoteSubquery.postId));
    }

   const allPosts = await query.where(and(eq(posts.mode, mode), eq(posts.community, communityName)))
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
     userVote: p.userVote as 'up' | 'down' | null,
     commentsCount: p.commentsCount,
   }));
 } catch (error) {
   console.error('Database error fetching posts by community:', error);
   return [];
 }
}

    
