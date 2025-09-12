import CommentSection from '@/components/CommentSection';
import { mockComments } from '@/data/mock-data';
import type { Post, Comment } from '@/lib/types';
import { notFound } from 'next/navigation';
import VoteButtons from '@/components/VoteButtons';
import { MessageSquare, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { getPostById } from '@/app/actions';
import { getOrCreateUser } from '@/app/auth/actions';
import { auth } from '@/lib/firebase';

export default async function PostPage({ params }: { params: { id: string } }) {
  const isStupidPost = params.id.startsWith('stupid-');
  const postId = isStupidPost ? params.id.replace('stupid-', '') : params.id;
  const postIdNum = parseInt(postId, 10);

  if (isNaN(postIdNum)) {
    notFound();
  }
  
  const firebaseUser = auth.currentUser;
  let user = null;
  if (firebaseUser) {
    user = await getOrCreateUser(firebaseUser.uid, firebaseUser.displayName, firebaseUser.email, firebaseUser.photoURL);
  }

  let post: Post | null = await getPostById(postIdNum, user?.id);
  const comments: Comment[] = mockComments[post?.id.replace('stupid-', '') || ''] || [];

  if (!post) {
    notFound();
  }

  // If the URL has a `stupid-` prefix but the post is 'real' (or vice-versa), it's a 404.
  const modeFromPost = post.mode || 'real';
  if ((isStupidPost && modeFromPost !== 'stupid') || (!isStupidPost && modeFromPost === 'stupid')) {
    notFound();
  }

  if (isStupidPost) {
    const currentUser = auth.currentUser;
    let stupidAuthor = { name: 'StupidUser', avatarUrl: undefined };
    if (currentUser) {
        const user = await getOrCreateUser(currentUser.uid, currentUser.displayName, currentUser.email, currentUser.photoURL);
        const hash = user.id.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        const stupidId = Math.abs(hash) % 10000;
        const stupidName = `StupidUser${String(stupidId).padStart(4, '0')}`;
        stupidAuthor = {
            name: stupidName,
            avatarUrl: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${stupidName}`
        }
    }
    
    post = {
      ...post,
      id: `stupid-${post.id}`,
      community: `stupid/${post.community}`,
      author: stupidAuthor,
    }
  }


  const isImagePost = post.link && /\.(jpg|jpeg|png|webp|avif|gif|picsum\.photos)/.test(post.link);
  const mode = isStupidPost ? 'stupid' : 'real';

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="flex bg-card p-4 rounded-lg">
        <VoteButtons
          postId={post.id}
          upvotes={post.upvotes}
          downvotes={post.downvotes}
          userVote={post.userVote}
          direction="col"
          mode={mode}
        />
        <div className="ml-4 flex-1">
          <div className="text-xs text-muted-foreground">
            <Link
              href={`/${mode}/c/${post.community}`}
              className="font-bold text-foreground hover:underline"
            >
              c/{post.community}
            </Link>
            <span className="mx-1">•</span>
            <span>Posted by u/{post.author.name}</span>
            <span className="mx-1">•</span>
            <span>{post.createdAt}</span>
          </div>
          <h1 className="text-2xl font-bold font-headline my-2 text-foreground">
            {post.title}
          </h1>
          
          {post.content && (
            <div className="text-base text-foreground/90 prose prose-invert max-w-none">
              <p>{post.content}</p>
            </div>
          )}

          {isImagePost ? (
            <div className="my-4">
              <Image src={post.link!} alt={post.title} width={800} height={600} className="rounded-md w-full h-auto" data-ai-hint="random image" />
            </div>
          ) : post.link && (
             <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2 mt-4">
                <span>{post.link}</span>
                <LinkIcon className="h-4 w-4" />
            </a>
          )}

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{post.commentsCount} Comments</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        <CommentSection postId={post.id} initialComments={comments} />
      </div>
    </div>
  );
}
