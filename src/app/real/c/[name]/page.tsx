import { Button } from '@/components/ui/button';
import PostCard from "@/components/PostCard";
import Link from "next/link";
import { getPostsByCommunity } from '@/app/actions';
import type { Post } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { getOrCreateUser } from '@/app/auth/actions';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';

export default async function CommunityPage({ params }: { params: { name: string } }) {
  const communityName = params.name;
  if (!communityName) {
    notFound();
  }

  const firebaseUser = auth.currentUser;
  let user = null;
  if (firebaseUser) {
    user = await getOrCreateUser(firebaseUser.uid, firebaseUser.displayName, firebaseUser.email, firebaseUser.photoURL);
  }
  
  const posts: Post[] = await getPostsByCommunity(communityName, 'real', user?.id) as Post[];
  
  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">r/{communityName}</h1>
            <p className="text-muted-foreground text-sm">The realest community on the internet.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild>
                <Link href="/submit">Create Post <Plus className="h-4 w-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
        <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} mode="real" />
              ))
            ) : (
              <div className="text-center py-16 border-dashed border-2 border-border rounded-lg">
                <h2 className="text-xl font-semibold">No posts in r/{communityName} yet</h2>
                <p className="text-muted-foreground mt-2">Be the first one to share something!</p>
                <Button asChild className="mt-4">
                    <Link href="/submit">Create Post</Link>
                </Button>
              </div>
            )}
        </div>
      </div>
  );
}

    