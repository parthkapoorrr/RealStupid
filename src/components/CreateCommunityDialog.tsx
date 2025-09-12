
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CreateCommunityDialogProps {
  mode: 'real' | 'stupid';
}

const formSchema = z.object({
  communityName: z.string().min(3, 'Community name must be at least 3 characters.').max(21, 'Community name cannot be longer than 21 characters.'),
});

export default function CreateCommunityDialog({ mode }: CreateCommunityDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      communityName: '',
    },
  });

  const prefix = mode === 'real' ? 'r/' : 's/';
  const ringColor = mode === 'real' ? 'focus-visible:ring-ring' : 'focus-visible:ring-search-ring';

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Creating community:', `${prefix}${values.communityName}`);
    // In a real app, you would call a server action here to create the community.
    toast({
      title: 'Community Created!',
      description: `Your new community ${prefix}${values.communityName} is ready.`,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className={cn(mode === 'real' ? "hover:border-primary" : "hover:border-search-ring")}>
            <Plus className={cn(mode === 'real' ? 'text-primary' : 'text-search-ring')} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a {mode} community</DialogTitle>
          <DialogDescription>
            Choose a name for your new community. You can't change it later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="communityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community Name</FormLabel>
                  <div className="relative">
                    <p className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {prefix}
                    </p>
                    <FormControl>
                      <Input
                        placeholder="community_name"
                        className={cn("pl-8", ringColor)}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" className={cn(mode === 'real' ? "bg-primary text-primary-foreground" : "bg-search-ring text-primary-foreground")}>
                    Create Community
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
