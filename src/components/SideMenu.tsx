'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Menu, Plus, Users, Search } from 'lucide-react';
import CreateCommunityForm from './CreateCommunityDialog';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getCommunities } from '@/app/actions';
import type { Community } from '@/lib/db/schema';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';

export default function SideMenu() {
  const { mode } = useAuth();
  const [open, setOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchCommunities() {
      const comms = await getCommunities();
      // Add some default popular communities if they don't exist
      const defaultCommunities = [
        { name: 'announcements', mode: 'real' },
        { name: 'memes', mode: 'stupid' },
        { name: 'programming', mode: 'real' },
        { name: 'gaming', mode: 'real' },
        { name: 'showerthoughts', mode: 'stupid' },
      ];
      
      const communitiesToAdd = defaultCommunities.filter(
        dc => !comms.some(c => c.name === dc.name && c.mode === dc.mode)
      );
      
      // Note: In a real app, you might want a more robust seeding mechanism
      // This is a simplified approach for demonstration
      if (communitiesToAdd.length > 0) {
        // This is a client component, so we can't call a server action to create them here.
        // We'll just prepend them to the list for UI purposes.
        const defaultsAsCommunities: Community[] = communitiesToAdd.map((dc, i) => ({
          id: 1000 + i, // fake id
          name: dc.name,
          mode: dc.mode as 'real' | 'stupid',
          creatorId: 'system',
          createdAt: new Date(),
        }));
        setCommunities([...defaultsAsCommunities, ...comms]);
      } else {
        setCommunities(comms);
      }
    }
    fetchCommunities();
  }, []);

  const effectiveMode = mode === 'none' ? 'real' : mode;

  const filteredCommunities = communities.filter(
    (community) =>
      community.mode === effectiveMode &&
      community.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCommunityCreated = () => {
    setCreateDialogOpen(false);
    // You could re-fetch communities here or optimistically update the state
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu
            className={cn(
              'h-6 w-6',
              effectiveMode === 'real' ? 'text-primary' : 'text-search-ring'
            )}
          />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle
            className={cn(
              'capitalize',
              effectiveMode === 'real' ? 'text-primary' : 'text-search-ring'
            )}
          >
            {effectiveMode} Communities
          </SheetTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'pl-9',
                effectiveMode === 'real' ? 'focus-visible:ring-ring' : 'focus-visible:ring-search-ring'
              )}
            />
          </div>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="space-y-2 py-4">
            {filteredCommunities.map((community) => (
              <SheetClose asChild key={community.id}>
                <Link href={`/${community.mode}/c/${community.name}`} legacyBehavior>
                  <a className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                    <Users className="h-4 w-4" />
                    {community.name}
                  </a>
                </Link>
              </SheetClose>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <SheetFooter className="mt-auto">
          <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Create Community
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a {effectiveMode} community</DialogTitle>
                <DialogDescription>
                  Choose a name for your new community. You can't change it later.
                </DialogDescription>
              </DialogHeader>
              <CreateCommunityForm onCommunityCreated={handleCommunityCreated} />
            </DialogContent>
          </Dialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
