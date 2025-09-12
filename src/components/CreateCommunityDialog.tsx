'use client';

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
import { createCommunity } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  communityName: z.string().min(3, 'Community name must be at least 3 characters.').max(21, 'Community name cannot be longer than 21 characters.').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores are allowed.'),
});

interface CreateCommunityFormProps {
  onCommunityCreated?: () => void;
}

export default function CreateCommunityForm({ onCommunityCreated }: CreateCommunityFormProps) {
  const { toast } = useToast();
  const { mode, user } = useAuth();
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      communityName: '',
    },
  });

  const effectiveMode = mode === 'none' ? 'real' : mode;
  const prefix = effectiveMode === 'real' ? 'r/' : 's/';
  const ringColor = effectiveMode === 'real' ? 'focus-visible:ring-ring' : 'focus-visible:ring-search-ring';

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
        toast({ title: "Login Required", description: "You must be logged in to create a community.", variant: "destructive" });
        return;
    }

    const formData = new FormData();
    formData.append('communityName', values.communityName);
    formData.append('creatorId', user.uid);
    formData.append('mode', effectiveMode);

    const result = await createCommunity(formData);

    if (result.success) {
        toast({
            title: 'Community Created!',
            description: `Your new community ${prefix}${result.name} is ready.`,
        });
        form.reset();
        if (onCommunityCreated) {
            onCommunityCreated();
        }
        router.refresh(); // Refresh the page to update community list in side menu
    } else {
        toast({
            title: 'Creation Failed',
            description: result.message,
            variant: 'destructive',
        });
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
            <Button type="submit" disabled={form.formState.isSubmitting} className={cn(effectiveMode === 'real' ? "bg-primary text-primary-foreground" : "bg-search-ring text-primary-foreground")}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Community
            </Button>
        </div>
      </form>
    </Form>
  );
}
