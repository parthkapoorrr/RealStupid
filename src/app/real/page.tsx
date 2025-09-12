import { Button } from '@/components/ui/button';
import PostCard from "@/components/PostCard";
import Link from "next/link";
import { getPosts } from '../actions';
import type { Post } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { getOrCreateUser } from '../auth/actions';
import CreateCommunityDialog from '@/components/CreateCommunityDialog';

export default async function RealPage() {
  // This is a server component, so we can't use the useAuth hook.
  // We'll get the user directly from firebase auth.
  const firebaseUser = auth.currentUser;
  let user = null;
  if (firebaseUser) {
    user = await getOrCreateUser(firebaseUser.uid, firebaseUser.displayName, firebaseUser.email, firebaseUser.photoURL);
  }
  
  const posts: Post[] = await getPosts('real', user?.id) as Post[];
  
  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-headline text-primary">Real Feed</h1>
          <div className="flex items-center gap-4">
            <Button asChild className="bg-search-ring hover:bg-search-ring/90 text-primary-foreground">
                <Link href="/stupid">Go Stupid</Link>
            </Button>
            <CreateCommunityDialog mode="real" />
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
