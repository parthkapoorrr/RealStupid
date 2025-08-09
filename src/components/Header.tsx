'use client';

import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import Logo from './icons/Logo';
import { useAuth } from '@/hooks/useAuth';
import { UserNav } from './UserNav';
import { Skeleton } from './ui/skeleton';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

export default function Header() {
  const { effectiveUser, loading, signInWithGoogle } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-4 flex items-center space-x-2">
          <Logo className="h-6 w-6" />
          <span className="font-bold font-headline text-xl">RealStupid</span>
        </Link>
        
        <Menubar className="border-none bg-transparent">
          <MenubarMenu>
            <MenubarTrigger asChild className="cursor-pointer">
                <Link href="/" className="text-primary hover:text-primary/90 font-semibold">real</Link>
            </MenubarTrigger>
          </MenubarMenu>
          <MenubarMenu>
             <MenubarTrigger asChild className="cursor-pointer">
                <Link href="/stupid" className="text-search-ring hover:text-search-ring/90 font-semibold">stupid</Link>
            </MenubarTrigger>
          </MenubarMenu>
        </Menubar>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 placeholder:text-muted-foreground focus-visible:ring-search-ring"
            />
          </div>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              <span className="sr-only">Notifications</span>
            </Button>
            {loading ? (
                <Skeleton className="h-9 w-20" />
            ) : effectiveUser ? (
              <UserNav user={effectiveUser} />
            ) : (
              <Button onClick={signInWithGoogle}>Login</Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
