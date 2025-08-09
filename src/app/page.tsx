import PostCard from '@/components/PostCard';
import { mockPosts } from '@/data/mock-data';
import type { Post } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const posts: Post[] = mockPosts;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Feed</h1>
        <Button asChild>
          <Link href="/submit">Create Post</Link>
        </Button>
      </div>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
