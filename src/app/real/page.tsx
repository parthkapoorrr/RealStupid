import { Button } from '@/components/ui/button';
import PostCard from "@/components/PostCard";
import Link from "next/link";
import { getPosts } from '../actions';
import type { Post } from '@/lib/types';

export default async function RealPage() {
  const posts: Post[] = await getPosts('real') as Post[];
  
  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Real Feed</h1>
          <div className="flex items-center gap-4">
            <Button asChild className="bg-search-ring hover:bg-search-ring/90 text-primary-foreground">
                <Link href="/stupid">Go Stupid</Link>
            </Button>
            <Button asChild>
                <Link href="/submit">Create Post</Link>
            </Button>
          </div>
        </div>
        <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} mode="real" />
              ))
            ) : (
              <p className="text-center text-muted-foreground pt-10">No posts yet. Be the first to create one!</p>
            )}
        </div>
      </div>
  );
}
