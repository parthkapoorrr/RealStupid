'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import CreateCommunityForm from './CreateCommunityDialog';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function SideMenu() {
  const { mode } = useAuth();
  const [open, setOpen] = useState(false);
  const effectiveMode = mode === 'none' ? 'real' : mode;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Create a {effectiveMode} community</SheetTitle>
          <SheetDescription>
            Choose a name for your new community. You can't change it later.
          </SheetDescription>
        </SheetHeader>
        <CreateCommunityForm onCommunityCreated={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
