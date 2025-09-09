"use client";
import React from "react";
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
        colors={["#ec4899", "#06b6d4", "#d946ef", "#3b82f6"]}
        waveOpacity={0.6}
        blur={15}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Logo className="w-20 h-20 text-primary" />
          <h1 className={cn("md:text-5xl text-3xl text-foreground font-headline mt-4")}>
            Welcome to <span className="text-primary">Real</span><span className="text-search-ring">Stupid</span>
          </h1>
          <p className="mt-4 text-lg font-headline text-foreground/80">
            Everyone has two sides, pick yours :)
          </p>
          <div className="absolute bottom-20">
            <Button onClick={signInWithGoogle} className="font-bold text-lg px-8 py-6 bg-gradient-to-r from-pink-500 to-cyan-500 text-primary-foreground hover:from-pink-500/90 hover:to-cyan-500/90">
                Get Started
            </Button>
          </div>
        </div>
      </WavyBackground>
    );
  }
  
  // This part is now hidden by the landing page, but kept for when the user logs in.
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Content for logged-in users would go here, maybe redirect to a different page? */}
        </div>
      </div>
    </>
  );
}