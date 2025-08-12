
'use client';

import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import Logo from './icons/Logo';
import { useAuth } from '@/hooks/useAuth';
import { UserNav } from './UserNav';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Button as MovingBorderButton } from '@/components/ui/moving-border';


export default function Header() {
  const { effectiveUser, loading, signInWithGoogle, mode } = useAuth();

  const borderClassName = mode === 'real' 
    ? "bg-[radial-gradient(var(--primary)_40%,transparent_60%)]" 
    : "bg-[radial-gradient(var(--search-ring)_40%,transparent_60%)]";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Logo className="h-6 w-6" />
          </Link>
          <span className="font-bold font-headline text-xl">
            <Link href="/"><span className="text-primary">Real</span></Link>
            <Link href="/stupid"><span className="text-search-ring">Stupid</span></Link>
          </span>
        </div>
        
        <div className="flex-1 flex justify-center px-4">
            <div className="relative w-full max-w-md">
              <MovingBorderButton
                as="div"
                containerClassName="h-10 w-full"
                borderRadius="0.5rem"
                borderClassName={borderClassName}
                className="p-0 bg-transparent items-center flex"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className={cn(
                    'pl-9 placeholder:text-muted-foreground h-full w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0',
                  )}
                />
              </MovingBorderButton>
            </div>
        </div>

        <div className="flex items-center space-x-4">
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
