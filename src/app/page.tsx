
"use client";
import React from "react";
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import { mockPosts } from '@/data/mock-data';
import type { Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Logo from "@/components/icons/Logo";
import { Loader2 } from "lucide-react";
import { WavyBackground } from "@/components/ui/wavy-background";

export default function Home() {
  const { effectiveUser, loading, signInWithGoogle } = useAuth();
  
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!effectiveUser) {
    return (
      <WavyBackground
        className="max-w-4xl mx-auto pb-40"
        colors={["#ff007f", "#00ffff", "#ff00ff", "#33ccff", "#ff33cc"]}
        waveWidth={30}
        backgroundFill="hsl(var(--background))"
        speed="slow"
      >
        <div className="flex flex-col items-center gap-2 relative z-20">
            <Logo className="w-20 h-20 text-primary" />
            <h1 className={cn("md:text-5xl text-3xl text-foreground relative z-20 font-headline")}>
                Welcome to <span className="text-primary">Real</span><span className="text-search-ring">Stupid</span>
            </h1>
        </div>
        <p className="text-center mt-2 text-muted-foreground relative z-20 font-headline">
          Everyone has two sides, pick yours :)
        </p>
        <Button onClick={signInWithGoogle} className="mt-8 z-20 font-bold text-lg px-8 py-6 bg-gradient-to-r from-primary to-search-ring text-primary-foreground hover:from-primary/90 hover:to-search-ring/90">
            Login with Google
        </Button>
      </WavyBackground>
    );
  }
  
  const posts: Post[] = mockPosts;

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline text-primary">Real Feed</h1>
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
      </div>
    </>
  );
}
