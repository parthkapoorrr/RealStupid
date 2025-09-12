'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  communityName: z.string().min(3, 'Community name must be at least 3 characters.').max(21, 'Community name cannot be longer than 21 characters.'),
});

interface CreateCommunityFormProps {
  onCommunityCreated?: () => void;
}

export default function CreateCommunityForm({ onCommunityCreated }: CreateCommunityFormProps) {
  const { toast } = useToast();
  const { mode } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      communityName: '',
    },
  });

  const effectiveMode = mode === 'none' ? 'real' : mode;
  const prefix = effectiveMode === 'real' ? 'r/' : 's/';
  const ringColor = effectiveMode === 'real' ? 'focus-visible:ring-ring' : 'focus-visible:ring-search-ring';

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Creating community:', `${prefix}${values.communityName}`);
    // In a real app, you would call a server action here to create the community.
    toast({
      title: 'Community Created!',
      description: `Your new community ${prefix}${values.communityName} is ready.`,
    });
    form.reset();
    if (onCommunityCreated) {
      onCommunityCreated();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
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
        <div className="flex justify-end">
            <Button type="submit" className={cn(effectiveMode === 'real' ? "bg-primary text-primary-foreground" : "bg-search-ring text-primary-foreground")}>
                Create Community
            </Button>
        </div>
      </form>
    </Form>
  );
}
