
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Link as LinkIcon } from 'lucide-react';
import type { Post } from '@/lib/types';
import { Card } from '@/components/ui/card';
import VoteButtons from './VoteButtons';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  mode?: 'real' | 'stupid';
}

export default function PostCard({ post, mode = 'real' }: PostCardProps) {
  const isImagePost = !!post.imageUrl;

  const cardClassName = cn(
    "flex bg-card p-2 rounded-lg transition-colors duration-200 border border-transparent",
    mode === 'real' ? 'hover:border-primary/50' : 'hover:border-search-ring/50'
  );

  const communityLink = `/${mode}/c/${post.community}`;
  const postLink = `/post/${post.id}`;
  const communityPrefix = mode === 'real' ? 'r/' : 's/';

  return (
    <Card className={cardClassName}>
      <VoteButtons
        postId={post.id}
        upvotes={post.upvotes}
        downvotes={post.downvotes}
        userVote={post.userVote}
        direction="col"
        mode={mode}
      />
      <div className="ml-4 flex-1 overflow-hidden">
        <div className="text-xs text-muted-foreground">
          <Link
            href={communityLink}
            className="font-bold text-foreground hover:underline"
          >
            {communityPrefix}{post.community}
          </Link>
          <span className="mx-1">•</span>
          <span>Posted by u/{post.author.name}</span>
          <span className="mx-1">•</span>
          <span>{post.createdAt}</span>
        </div>
        <Link href={postLink} className="block">
            <h3 className="text-lg font-medium font-headline my-1 text-foreground">
                {post.title}
            </h3>
        </Link>
        
        {isImagePost ? (
            <Link href={postLink} className="block mt-2">
                <div className="relative h-80 overflow-hidden rounded-md">
                    <Image src={post.imageUrl!} alt={post.title} fill className="object-cover" data-ai-hint="placeholder image" />
                </div>
            </Link>
        ) : post.content && (
            <Link href={postLink} className="text-sm text-foreground/90 max-h-40 overflow-hidden relative block">
                <p>{post.content}</p>
                 <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-card to-transparent" />
            </Link>
        )}
        
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <Link href={postLink} className="flex items-center gap-1 hover:text-primary">
            <MessageSquare className="h-4 w-4" />
            <span>{post.commentsCount} Comments</span>
          </Link>
          {post.link && (
            <a href={post.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary text-primary">
              <LinkIcon className="h-4 w-4" />
              <span>{new URL(post.link).hostname}</span>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
