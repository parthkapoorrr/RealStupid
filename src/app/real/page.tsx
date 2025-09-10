"use client";
import React from "react";
import { Button } from '@/components/ui/button';
import PostCard from "@/components/PostCard";
import { mockPosts } from "@/data/mock-data";
import Link from "next/link";

export default function RealPage() {
  
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
            {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} mode="real" />
            ))}
        </div>
      </div>
  );
}
